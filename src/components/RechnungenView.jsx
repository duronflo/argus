import { useMemo, useState } from 'react';
import { formatCurrency } from '../utils/dateUtils';
import { getAnteile, getEinheitIds } from '../domain/model';
import { useProject } from '../state/ProjectContext';
import Badge from './Badge';
import Modal from './Modal';
import SortTh from './SortHeader';
import { sortBy, useSort } from '../utils/sort';

const EMPTY_RECHNUNG = {
  gewerkId: '', angebotId: null, einheitId: null, anbieter: '', titel: '', betrag: '', bezahlt: false, notiz: '',
};

function einheitName(einheiten, id) {
  return einheiten.find((e) => e.id === id)?.name || '—';
}

function verteilungText(gewerk, einheiten) {
  return Object.entries(getAnteile(gewerk))
    .map(([id, anteil]) => `${einheitName(einheiten, id)} ${Math.round(anteil * 100)} %`)
    .join(' · ');
}

export function RechnungForm({ initial, fixedGewerkId, onSave, onCancel }) {
  const { data } = useProject();
  const { gewerke, angebote, einheiten } = data;
  const [form, setForm] = useState({ ...EMPTY_RECHNUNG, ...initial, gewerkId: initial?.gewerkId || fixedGewerkId || '' });

  const gewerk = gewerke.find((g) => g.id === form.gewerkId);
  const gewerkAngebote = angebote.filter((a) => a.gewerkId === form.gewerkId);
  const gewerkEinheitIds = gewerk ? getEinheitIds(gewerk) : [];

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setGewerk(gewerkId) {
    // Offer and unit belong to the trade – reset them when the trade changes.
    setForm((prev) => ({ ...prev, gewerkId, angebotId: null, einheitId: null }));
  }

  function setAngebot(angebotId) {
    const angebot = angebote.find((a) => a.id === angebotId);
    setForm((prev) => ({
      ...prev,
      angebotId: angebotId || null,
      anbieter: prev.anbieter || angebot?.anbieter || '',
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.gewerkId) return;
    onSave({ ...form, betrag: parseFloat(form.betrag) || 0 });
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {!fixedGewerkId && (
        <div className="form-row">
          <label className="form-label">Gewerk *</label>
          <select className="select" required value={form.gewerkId} onChange={(e) => setGewerk(e.target.value)}>
            <option value="">Bitte wählen…</option>
            {gewerke.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      )}
      {gewerkAngebote.length > 0 && (
        <div className="form-row">
          <label className="form-label">Zu Angebot</label>
          <select className="select" value={form.angebotId || ''} onChange={(e) => setAngebot(e.target.value)}>
            <option value="">— ohne Angebot (z. B. Materialeinkauf) —</option>
            {gewerkAngebote.map((a) => (
              <option key={a.id} value={a.id}>{a.anbieter}{a.titel ? ` – ${a.titel}` : ''}</option>
            ))}
          </select>
        </div>
      )}
      {gewerkEinheitIds.length > 1 && (
        <div className="form-row">
          <label className="form-label">Einheit</label>
          <select className="select" value={form.einheitId || ''} onChange={(e) => set('einheitId', e.target.value || null)}>
            <option value="">Nach Verteilung ({verteilungText(gewerk, einheiten)})</option>
            {gewerkEinheitIds.map((id) => <option key={id} value={id}>Nur {einheitName(einheiten, id)}</option>)}
          </select>
        </div>
      )}
      <div className="form-row">
        <label className="form-label">Lieferant / Anbieter *</label>
        <input className="input" required value={form.anbieter} onChange={(e) => set('anbieter', e.target.value)} />
      </div>
      <div className="form-row">
        <label className="form-label">Titel</label>
        <input className="input" value={form.titel} onChange={(e) => set('titel', e.target.value)} placeholder="z. B. Abschlagsrechnung 1" />
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label className="form-label">Betrag (€)</label>
          <input className="input" type="number" step="0.01" min="0" value={form.betrag} onChange={(e) => set('betrag', e.target.value)} />
        </div>
        <div className="form-row">
          <label className="form-label">Status</label>
          <label className="checkbox-row">
            <input type="checkbox" checked={!!form.bezahlt} onChange={(e) => set('bezahlt', e.target.checked)} />
            Bezahlt
          </label>
        </div>
      </div>
      <div className="form-row">
        <label className="form-label">Notiz</label>
        <textarea className="input textarea" rows={2} value={form.notiz} onChange={(e) => set('notiz', e.target.value)} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn-primary">Speichern</button>
      </div>
    </form>
  );
}

/**
 * Invoice table with add/edit/delete. With fixedGewerkId it is the compact
 * version inside the trade dialog (no filters, no trade column).
 */
export function RechnungenTable({ rechnungen, fixedGewerkId }) {
  const { data, actions } = useProject();
  const { gewerke, angebote, einheiten } = data;
  const [editing, setEditing] = useState(null); // null | 'new' | rechnung
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const sorting = useSort(null);

  const fixedGewerk = gewerke.find((g) => g.id === fixedGewerkId);
  const sorted = sortBy(rechnungen, sorting.sort, {
    gewerk: (r) => gewerke.find((g) => g.id === r.gewerkId)?.name,
    anbieter: (r) => r.anbieter,
    titel: (r) => r.titel,
    angebot: (r) => angebote.find((a) => a.id === r.angebotId)?.anbieter,
    einheit: (r) => (r.einheitId ? einheitName(einheiten, r.einheitId) : ''),
    betrag: (r) => r.betrag || 0,
    status: (r) => (r.bezahlt ? 1 : 0),
  });
  const showEinheit = fixedGewerk ? getEinheitIds(fixedGewerk).length > 1 : einheiten.length > 0;
  const sumBetrag = rechnungen.reduce((s, r) => s + (r.betrag || 0), 0);
  const sumBezahlt = rechnungen.reduce((s, r) => s + (r.bezahlt ? r.betrag || 0 : 0), 0);

  return (
    <>
      <div className="offer-table-header">
        <h3 className="subsection-title">Rechnungen ({rechnungen.length})</h3>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setEditing('new')}
          disabled={gewerke.length === 0}
          title={gewerke.length === 0 ? 'Bitte zuerst ein Gewerk anlegen.' : undefined}
        >
          + Rechnung
        </button>
      </div>

      {rechnungen.length === 0 ? (
        <p className="empty-state">Noch keine Rechnungen erfasst.</p>
      ) : (
        <div className="table-wrap">
          <table className="table table--stack">
            <thead>
              <tr>
                {!fixedGewerkId && <SortTh label="Gewerk" column="gewerk" sorting={sorting} />}
                <SortTh label="Lieferant" column="anbieter" sorting={sorting} />
                <SortTh label="Titel" column="titel" sorting={sorting} />
                <SortTh label="Angebot" column="angebot" sorting={sorting} />
                {showEinheit && <SortTh label="Einheit" column="einheit" sorting={sorting} />}
                <SortTh label="Betrag" column="betrag" sorting={sorting} firstDir="desc" className="text-right" />
                <SortTh label="Status" column="status" sorting={sorting} />
                <th aria-label="Aktionen"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const gewerk = gewerke.find((g) => g.id === r.gewerkId);
                const angebot = angebote.find((a) => a.id === r.angebotId);
                return (
                  <tr key={r.id}>
                    {!fixedGewerkId && (
                      <td data-label="Gewerk">
                        {gewerk ? (
                          <button type="button" className="link-button" onClick={() => actions.openGewerk(gewerk.id)}>
                            {gewerk.name}
                          </button>
                        ) : '—'}
                      </td>
                    )}
                    <td className="cell-title"><strong>{r.anbieter}</strong>{r.notiz && <div className="note-cell">{r.notiz}</div>}</td>
                    <td data-label="Titel">{r.titel || '—'}</td>
                    <td data-label="Angebot">{angebot ? angebot.anbieter : '—'}</td>
                    {showEinheit && <td data-label="Einheit">{r.einheitId ? einheitName(einheiten, r.einheitId) : <span className="muted">verteilt</span>}</td>}
                    <td data-label="Betrag" className="text-right cell-amount">{formatCurrency(r.betrag || 0)}</td>
                    <td data-label="Status"><Badge status={r.bezahlt ? 'bezahlt' : 'offen'} small /></td>
                    <td className="cell-actions">
                      <div className="row-actions">
                        <button className="btn-icon" title="Bearbeiten" onClick={() => setEditing(r)}>✏</button>
                        <button className="btn-icon btn-icon--danger" title="Löschen" onClick={() => setDeleteConfirm(r.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="table-foot">
                <td colSpan={fixedGewerkId ? 3 : 4}><strong>Summe</strong> · davon bezahlt {formatCurrency(sumBezahlt)}</td>
                {showEinheit && <td className="cell-empty"></td>}
                <td className="text-right"><strong>{formatCurrency(sumBetrag)}</strong></td>
                <td colSpan={2} className="cell-empty"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Neue Rechnung' : 'Rechnung bearbeiten'} onClose={() => setEditing(null)}>
          <RechnungForm
            initial={editing === 'new' ? null : editing}
            fixedGewerkId={fixedGewerkId}
            onSave={(rechnung) => { actions.save('rechnungen', rechnung); setEditing(null); }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Rechnung löschen?" onClose={() => setDeleteConfirm(null)} width={380}>
          <p>Soll diese Rechnung wirklich gelöscht werden?</p>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Abbrechen</button>
            <button className="btn btn-danger" onClick={() => { actions.remove('rechnungen', deleteConfirm); setDeleteConfirm(null); }}>Löschen</button>
          </div>
        </Modal>
      )}
    </>
  );
}

export default function RechnungenView() {
  const { data } = useProject();
  const { gewerke, einheiten, rechnungen } = data;
  const [search, setSearch] = useState('');
  const [filterGewerk, setFilterGewerk] = useState('');
  const [filterEinheit, setFilterEinheit] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    const gewerkName = (id) => gewerke.find((g) => g.id === id)?.name || '';
    return rechnungen
      .filter((r) => {
        const gewerk = gewerke.find((g) => g.id === r.gewerkId);
        if (filterGewerk && r.gewerkId !== filterGewerk) return false;
        if (filterStatus && (filterStatus === 'bezahlt') !== !!r.bezahlt) return false;
        // A unit filter matches invoices booked on that unit and distributed
        // invoices of trades that include the unit.
        if (filterEinheit && !(r.einheitId === filterEinheit || (!r.einheitId && getEinheitIds(gewerk).includes(filterEinheit)))) return false;
        return !query || [r.anbieter, r.titel, r.notiz, gewerk?.name].some((v) => (v || '').toLowerCase().includes(query));
      })
      .sort((a, b) => gewerkName(a.gewerkId).localeCompare(gewerkName(b.gewerkId), 'de')
        || (a.anbieter || '').localeCompare(b.anbieter || '', 'de'));
  }, [rechnungen, gewerke, search, filterGewerk, filterEinheit, filterStatus]);

  const sumBetrag = filtered.reduce((s, r) => s + (r.betrag || 0), 0);
  const sumBezahlt = filtered.reduce((s, r) => s + (r.bezahlt ? r.betrag || 0 : 0), 0);

  return (
    <div className="angebote-view">
      <h2 className="section-title">Rechnungen</h2>

      <div className="stats-row">
        <div className="stat-chip">
          <span className="stat-chip-label">Rechnungsbetrag</span>
          <span className="stat-chip-value">{formatCurrency(sumBetrag)}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-label">Bezahlt</span>
          <span className="stat-chip-value">{formatCurrency(sumBezahlt)}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-label">Noch zu zahlen</span>
          <span className="stat-chip-value">{formatCurrency(sumBetrag - sumBezahlt)}</span>
        </div>
      </div>

      <div className="trade-list-filters">
        <input className="input" placeholder="Suche nach Lieferant, Titel, Notiz oder Gewerk…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" value={filterGewerk} onChange={(e) => setFilterGewerk(e.target.value)} aria-label="Nach Gewerk filtern">
          <option value="">Alle Gewerke</option>
          {gewerke.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        {einheiten.length > 0 && (
          <select className="select" value={filterEinheit} onChange={(e) => setFilterEinheit(e.target.value)} aria-label="Nach Einheit filtern">
            <option value="">Alle Einheiten</option>
            {einheiten.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
        <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Nach Status filtern">
          <option value="">Alle Status</option>
          <option value="offen">Offen</option>
          <option value="bezahlt">Bezahlt</option>
        </select>
      </div>

      <div className="offer-table-wrap">
        <RechnungenTable rechnungen={filtered} />
      </div>
    </div>
  );
}
