import ExcelJS from 'exceljs';

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

export async function exportExcel(data, model, filename) {
  const { projekt, einheiten = [], gewerke = [], angebote = [], rechnungen = [] } = data;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Argus';
  workbook.created = new Date();
  const gewerkName = (id) => gewerke.find((g) => g.id === id)?.name || '';
  const einheitName = (id) => einheiten.find((e) => e.id === id)?.name || '';

  // ── Sheet 1: Projekt ──────────────────────────────────────────────────────
  const sheetProjekt = workbook.addWorksheet('Projekt');
  headerRow(sheetProjekt, ['Feld', 'Wert']);
  sheetProjekt.addRow(['Name', projekt.name]);
  sheetProjekt.addRow(['Adresse', projekt.adresse || '']);
  sheetProjekt.addRow(['Budget (€)', currency(model.projekt.budget)]);
  sheetProjekt.addRow(['Geplant (€)', currency(model.projekt.geplant)]);
  sheetProjekt.addRow(['Bezahlt (€)', currency(model.projekt.bezahlt)]);
  sheetProjekt.addRow(['Notizen', projekt.notizen || '']);
  autoWidth(sheetProjekt);

  // ── Sheet 2: Einheiten ────────────────────────────────────────────────────
  const sheetEinheiten = workbook.addWorksheet('Einheiten');
  headerRow(sheetEinheiten, ['Name', 'Budget (€)', 'Geplant (€)', 'Bezahlt (€)', 'Offen (€)', 'Notizen']);
  einheiten.forEach((eh) => {
    const stats = model.einheit(eh.id);
    sheetEinheiten.addRow([
      eh.name,
      currency(eh.budget),
      currency(stats.geplant),
      currency(stats.bezahlt),
      currency(stats.offen),
      eh.notizen || '',
    ]);
  });
  autoWidth(sheetEinheiten);

  // ── Sheet 3: Gewerke ──────────────────────────────────────────────────────
  const sheetGewerke = workbook.addWorksheet('Gewerke');
  headerRow(sheetGewerke, [
    'Name', 'Kategorie', 'Status', 'Budget (€)', 'Geplant (€)', 'Bezahlt (€)', 'Offen (€)',
    'Verteilung auf Einheiten', 'Notizen',
  ]);
  gewerke.forEach((g) => {
    const stats = model.gewerk(g.id);
    const verteilung = Object.entries(stats.proEinheit)
      .map(([id, s]) => `${einheitName(id)} ${Math.round(s.anteil * 100)} %`)
      .join(', ');
    sheetGewerke.addRow([
      g.name,
      g.kategorie || '',
      g.status || '',
      currency(stats.budget),
      currency(stats.geplant),
      currency(stats.bezahlt),
      currency(stats.offen),
      verteilung,
      g.notizen || '',
    ]);
  });
  autoWidth(sheetGewerke);

  // ── Sheet 4: Angebote ─────────────────────────────────────────────────────
  const sheetAngebote = workbook.addWorksheet('Angebote');
  headerRow(sheetAngebote, [
    'Gewerk', 'Anbieter', 'Titel', 'Angebotsbetrag (€)', 'Rechnungen', 'Rechnungsbetrag (€)', 'Status', 'Notiz',
  ]);
  angebote.forEach((a) => {
    const stats = model.angebot(a.id);
    sheetAngebote.addRow([
      gewerkName(a.gewerkId),
      a.anbieter || '',
      a.titel || '',
      currency(a.betragAngebot),
      stats.anzahlRechnungen,
      currency(stats.summeRechnungen),
      a.status || '',
      a.notiz || '',
    ]);
  });
  autoWidth(sheetAngebote);

  // ── Sheet 5: Rechnungen ───────────────────────────────────────────────────
  const sheetRechnungen = workbook.addWorksheet('Rechnungen');
  headerRow(sheetRechnungen, [
    'Gewerk', 'Einheit', 'Angebot', 'Lieferant', 'Titel', 'Betrag (€)', 'Bezahlt', 'Notiz',
  ]);
  rechnungen.forEach((r) => {
    sheetRechnungen.addRow([
      gewerkName(r.gewerkId),
      r.einheitId ? einheitName(r.einheitId) : 'verteilt',
      angebote.find((a) => a.id === r.angebotId)?.anbieter || '',
      r.anbieter || '',
      r.titel || '',
      currency(r.betrag),
      r.bezahlt ? 'ja' : 'nein',
      r.notiz || '',
    ]);
  });
  autoWidth(sheetRechnungen);

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
