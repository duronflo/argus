import { useState } from 'react';
import { formatCurrency, generateId } from '../utils/dateUtils';
import {
  getAngebotRechnungen,
  isAngebotBezahltMarkiert,
  sumAngebotBezahlt,
  sumAngebotRechnungsbetrag,
} from '../utils/calculations';
import Badge from './Badge';
import Modal from './Modal';

const ANGEBOT_STATUSES = ['offen', 'ausgewählt', 'abgelehnt'];
const RECHNUNG_STATUSES = ['offen', 'bezahlt'];

function AngebotForm({ initial, onSave, onCancel }) {
  const rechnungenInitial = Array.isArray(initial?.rechnungen) ? initial.rechnungen : [];
  const [form, setForm] = useState(
    {
      anbieter: '',
      titel: '',
      betragAngebot: '',
      bezahlt: '',
      bezahltMarkiert: false,
      status: 'offen',
      notiz: '',
      ...initial,
      rechnungen: rechnungenInitial.map((r) => ({
        id: r.id || generateId('rg'),
        titel: r.titel || '',
        betrag: r.betrag ?? '',
        bezahlt: r.bezahlt ?? '',
        bezahltMarkiert: !!r.bezahltMarkiert,
        status: r.status || 'offen',
        notiz: r.notiz || '',
      })),
    },
  );

  function set(field, val) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  function addRechnung() {
    setForm((prev) => ({
      ...prev,
      rechnungen: [
        ...(prev.rechnungen || []),
        {
          id: generateId('rg'),
          titel: '',
          betrag: '',
          bezahlt: '',
          bezahltMarkiert: false,
          status: 'offen',
          notiz: '',
        },
      ],
    }));
  }

  function setRechnung(id, field, val) {
    setForm((prev) => ({
      ...prev,
      rechnungen: (prev.rechnungen || []).map((r) => (r.id === id ? { ...r, [field]: val } : r)),
    }));
  }

  function removeRechnung(id) {
    setForm((prev) => ({
      ...prev,
      rechnungen: (prev.rechnungen || []).filter((r) => r.id !== id),
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const rechnungen = (form.rechnungen || [])
      .map((r) => ({
        ...r,
        titel: (r.titel || '').trim(),
        betrag: parseFloat(r.betrag) || 0,
        bezahlt: parseFloat(r.bezahlt) || 0,
        bezahltMarkiert: !!r.bezahltMarkiert,
      }))
      .filter((r) => r.titel || r.betrag > 0 || r.bezahlt > 0 || r.notiz || r.bezahltMarkiert);
    onSave({
      ...form,
      betragAngebot: parseFloat(form.betragAngebot) || 0,
      bezahlt: parseFloat(form.bezahlt) || 0,
      bezahltMarkiert: !!form.bezahltMarkiert,
      rechnungen,
    });
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label className="form-label">Anbieter *</label>
        <input className="input" required value={form.anbieter} onChange={(e) => set('anbieter', e.target.value)} />
      </div>
      <div className="form-row">
        <label className="form-label">Titel</label>
        <input className="input" value={form.titel} onChange={(e) => set('titel', e.target.value)} />
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label className="form-label">Angebotsbetrag (€)</label>
          <input className="input" type="number" step="0.01" min="0" value={form.betragAngebot} onChange={(e) => set('betragAngebot', e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <label className="form-label">Bezahlt (€)</label>
        <input className="input" type="number" step="0.01" min="0" value={form.bezahlt} onChange={(e) => set('bezahlt', e.target.value)} />
      </div>
      <div className="form-row">
        <div className="offer-table-header" style={{ marginBottom: 8 }}>
          <label className="form-label" style={{ margin: 0 }}>Rechnungen</label>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addRechnung}>+ Rechnung</button>
        </div>
        {(form.rechnungen || []).length === 0 ? (
          <span className="form-hint">Noch keine Rechnungen erfasst.</span>
        ) : (
          (form.rechnungen || []).map((r) => (
            <div key={r.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, marginBottom: 10 }}>
              <div className="form-row-2">
                <div className="form-row">
                  <label className="form-label">Titel</label>
                  <input className="input" value={r.titel} onChange={(e) => setRechnung(r.id, 'titel', e.target.value)} />
                </div>
                <div className="form-row">
                  <label className="form-label">Status</label>
                  <select className="select" value={r.status} onChange={(e) => setRechnung(r.id, 'status', e.target.value)}>
                    {RECHNUNG_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-row">
                  <label className="form-label">Rechnungsbetrag (€)</label>
                  <input className="input" type="number" step="0.01" min="0" value={r.betrag} onChange={(e) => setRechnung(r.id, 'betrag', e.target.value)} />
                </div>
                <div className="form-row">
                  <label className="form-label">Bezahlt (€)</label>
                  <input className="input" type="number" step="0.01" min="0" value={r.bezahlt} onChange={(e) => setRechnung(r.id, 'bezahlt', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <label className="status-filter-item">
                  <input type="checkbox" checked={!!r.bezahltMarkiert} onChange={(e) => setRechnung(r.id, 'bezahltMarkiert', e.target.checked)} />
                  Als bezahlt markiert
                </label>
              </div>
              <div className="form-row">
                <label className="form-label">Notiz</label>
                <textarea className="input textarea" rows={2} value={r.notiz} onChange={(e) => setRechnung(r.id, 'notiz', e.target.value)} />
              </div>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeRechnung(r.id)}>Rechnung löschen</button>
            </div>
          ))
        )}
      </div>
      <div className="form-row">
        <label className="status-filter-item">
          <input type="checkbox" checked={!!form.bezahltMarkiert} onChange={(e) => set('bezahltMarkiert', e.target.checked)} />
          Als bezahlt markiert
        </label>
      </div>
      <div className="form-row">
        <label className="form-label">Status</label>
        <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>
          {ANGEBOT_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label className="form-label">Notiz</label>
        <textarea className="input textarea" rows={3} value={form.notiz} onChange={(e) => set('notiz', e.target.value)} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn-primary">Speichern</button>
      </div>
    </form>
  );
}

export default function OfferTable({ angebote, onAddAngebot, onEditAngebot, onDeleteAngebot }) {
  const [showForm, setShowForm] = useState(false);
  const [editAngebot, setEditAngebot] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [sortOrder, setSortOrder] = useState('anbieter-asc');
  const sortedAngebote = [...angebote].sort((a, b) => {
    const direction = sortOrder.endsWith('-desc') ? -1 : 1;
    if (sortOrder.startsWith('amount-')) return direction * ((a.betragAngebot || 0) - (b.betragAngebot || 0));
    const field = sortOrder.startsWith('title-') ? 'titel' : sortOrder.startsWith('status-') ? 'status' : 'anbieter';
    return direction * (a[field] || '').localeCompare(b[field] || '', 'de', { sensitivity: 'base' });
  });

  const sumAngebote = angebote.reduce((s, a) => s + (a.betragAngebot || 0), 0);
  const sumBezahlt = angebote.reduce((s, a) => s + sumAngebotBezahlt(a), 0);

  return (
    <div className="offer-table-wrap">
      <div className="offer-table-header">
        <h3 className="subsection-title">Angebote ({angebote.length})</h3>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditAngebot(null); setShowForm(true); }}>
          + Angebot
        </button>
        <select className="select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} aria-label="Angebote sortieren">
          <option value="anbieter-asc">Anbieter (A–Z)</option>
          <option value="anbieter-desc">Anbieter (Z–A)</option>
          <option value="title-asc">Titel (A–Z)</option>
          <option value="title-desc">Titel (Z–A)</option>
          <option value="amount-asc">Betrag (aufsteigend)</option>
          <option value="amount-desc">Betrag (absteigend)</option>
          <option value="status-asc">Status (A–Z)</option>
          <option value="status-desc">Status (Z–A)</option>
        </select>
      </div>

      {angebote.length === 0 ? (
        <p className="empty-state">Noch keine Angebote. Klicke auf &ldquo;+ Angebot&rdquo;.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Anbieter</th>
                <th>Titel</th>
                <th className="text-right">Angebot</th>
                <th className="text-right">Rechnungen</th>
                <th className="text-right">Bezahlt</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedAngebote.map((a) => {
                const bezahlt = sumAngebotBezahlt(a);
                const rechnungsbetrag = sumAngebotRechnungsbetrag(a);
                const rechnungsCount = getAngebotRechnungen(a).length;
                return (
                <tr key={a.id} className={a.status === 'ausgewählt' ? 'row--selected' : a.status === 'abgelehnt' ? 'row--rejected' : ''}>
                  <td><strong>{a.anbieter}</strong></td>
                  <td>{a.titel || '—'}</td>
                  <td className="text-right">{formatCurrency(a.betragAngebot)}</td>
                  <td className="text-right">
                    {rechnungsCount > 0 ? `${rechnungsCount} · ${formatCurrency(rechnungsbetrag)}` : '—'}
                  </td>
                  <td className="text-right">
                    {bezahlt > 0 ? formatCurrency(bezahlt) : isAngebotBezahltMarkiert(a) ? 'Markiert' : '—'}
                  </td>
                  <td><Badge status={a.status} small /></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn-icon" title="Bearbeiten" onClick={() => { setEditAngebot(a); setShowForm(true); }}>✏</button>
                      <button className="btn-icon btn-icon--danger" title="Löschen" onClick={() => setDeleteConfirm(a.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="table-foot">
                <td colSpan={2}><strong>Summen</strong></td>
                <td className="text-right"><strong>{formatCurrency(sumAngebote)}</strong></td>
                <td></td>
                <td className="text-right"><strong>{formatCurrency(sumBezahlt)}</strong></td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {showForm && (
        <Modal
          title={editAngebot ? 'Angebot bearbeiten' : 'Neues Angebot'}
          onClose={() => setShowForm(false)}
        >
          <AngebotForm
            initial={editAngebot}
            onSave={(data) => {
              if (editAngebot) {
                onEditAngebot({ ...editAngebot, ...data });
              } else {
                onAddAngebot(data);
              }
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Angebot löschen?" onClose={() => setDeleteConfirm(null)} width={380}>
          <p>Soll dieses Angebot wirklich gelöscht werden?</p>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Abbrechen</button>
            <button className="btn btn-danger" onClick={() => { onDeleteAngebot(deleteConfirm); setDeleteConfirm(null); }}>Löschen</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
