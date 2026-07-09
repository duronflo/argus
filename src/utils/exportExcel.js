import ExcelJS from 'exceljs';
import { calcEinheitStats } from './calculations';

function headerRow(sheet, headers) {
  const row = sheet.addRow(headers);
  row.font = { bold: true };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
  row.border = {
    bottom: { style: 'thin', color: { argb: 'FF93C5FD' } },
  };
}

function autoWidth(sheet) {
  sheet.columns.forEach((col) => {
    let max = 10;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 2, 60);
  });
}

function currency(val) {
  return typeof val === 'number' ? val : 0;
}

export async function exportExcel(data, filename) {
  const { projekt, einheiten = [], gewerke = [], angebote = [], meilensteine = [] } = data;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Argus';
  workbook.created = new Date();

  // ── Sheet 1: Projekt ──────────────────────────────────────────────────────
  const sheetProjekt = workbook.addWorksheet('Projekt');
  headerRow(sheetProjekt, ['Feld', 'Wert']);
  sheetProjekt.addRow(['Name', projekt.name]);
  sheetProjekt.addRow(['Adresse', projekt.adresse || '']);
  sheetProjekt.addRow(['Budget (€)', currency(projekt.budget)]);
  sheetProjekt.addRow(['Notizen', projekt.notizen || '']);
  autoWidth(sheetProjekt);

  // ── Sheet 2: Einheiten ────────────────────────────────────────────────────
  const sheetEinheiten = workbook.addWorksheet('Einheiten');
  headerRow(sheetEinheiten, ['Name', 'Budget (€)', 'Beauftragt (€)', 'Bezahlt (€)', 'Offen (€)', 'Notizen']);
  einheiten.forEach((eh) => {
    const stats = calcEinheitStats(eh, gewerke, angebote);
    sheetEinheiten.addRow([
      eh.name,
      currency(eh.budget),
      currency(stats.sumBeauftragt),
      currency(stats.sumBezahlt),
      currency(stats.sumOffen),
      eh.notizen || '',
    ]);
  });
  autoWidth(sheetEinheiten);

  // ── Sheet 3: Gewerke ──────────────────────────────────────────────────────
  const sheetGewerke = workbook.addWorksheet('Gewerke');
  headerRow(sheetGewerke, [
    'Name', 'Kategorie', 'Status',
    'Geplanter Start', 'Geplantes Ende',
    'Tatsächlicher Start', 'Tatsächliches Ende',
    'Zugeordnete Einheiten', 'Notizen',
  ]);
  gewerke.forEach((g) => {
    const assignedNames = (g.einheitIds || [])
      .map((eid) => einheiten.find((e) => e.id === eid)?.name)
      .filter(Boolean)
      .join(', ');
    sheetGewerke.addRow([
      g.name,
      g.kategorie || '',
      g.status || '',
      g.geplanterStart || '',
      g.geplantesEnde || '',
      g.tatsaechlicherStart || '',
      g.tatsaechlichesEnde || '',
      assignedNames,
      g.notizen || '',
    ]);
  });
  autoWidth(sheetGewerke);

  // ── Sheet 4: Angebote ─────────────────────────────────────────────────────
  const sheetAngebote = workbook.addWorksheet('Angebote');
  headerRow(sheetAngebote, [
    'Gewerk', 'Anbieter', 'Titel',
    'Angebotsbetrag (€)', 'Beauftragt (€)', 'Bezahlt (€)', 'Offen (€)',
    'Status', 'Datum', 'Gültig bis', 'Notiz',
  ]);
  angebote.forEach((a) => {
    const gewerk = gewerke.find((g) => g.id === a.gewerkId);
    sheetAngebote.addRow([
      gewerk ? gewerk.name : '',
      a.anbieter || '',
      a.titel || '',
      currency(a.betragAngebot),
      currency(a.betragBeauftragt),
      currency(a.bezahlt),
      currency(a.betragBeauftragt) - currency(a.bezahlt),
      a.status || '',
      a.datum || '',
      a.gueltigBis || '',
      a.notiz || '',
    ]);
  });
  autoWidth(sheetAngebote);

  // ── Sheet 5: Meilensteine ─────────────────────────────────────────────────
  const sheetMeilensteine = workbook.addWorksheet('Meilensteine');
  headerRow(sheetMeilensteine, ['Titel', 'Datum', 'Status', 'Verknüpftes Gewerk']);
  meilensteine.forEach((m) => {
    const gewerk = m.gewerkId ? gewerke.find((g) => g.id === m.gewerkId) : null;
    sheetMeilensteine.addRow([
      m.titel || '',
      m.datum || '',
      m.status || '',
      gewerk ? gewerk.name : '',
    ]);
  });
  autoWidth(sheetMeilensteine);

  // ── Write & download ──────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `argus-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
