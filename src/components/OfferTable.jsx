import { useState } from 'react';
import { formatCurrency } from '../utils/dateUtils';
import { useProject } from '../state/ProjectContext';
import Badge from './Badge';
import Modal from './Modal';

const ANGEBOT_STATUSES = ['offen', 'ausgewählt', 'abgelehnt'];

function AngebotForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ anbieter: '', titel: '', betragAngebot: '', status: 'offen', notiz: '', ...initial });

  function set(field, val) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, betragAngebot: parseFloat(form.betragAngebot) || 0 }); }}>
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
        <div className="form-row">
          <label className="form-label">Status</label>
          <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>
            {ANGEBOT_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row">
        <label className="form-label">Notiz</label>
        <textarea className="input textarea" rows={3} value={form.notiz} onChange={(e) => set('notiz', e.target.value)} />
      </div>
      <p className="form-hint">Zahlungen werden als Rechnung erfasst – beim Anlegen der Rechnung dieses Angebot auswählen.</p>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn-primary">Speichern</button>
      </div>
    </form>
  );
}

export default function OfferTable({ gewerkId }) {
  const { data, model, actions } = useProject();
  const angebote = data.angebote
    .filter((a) => a.gewerkId === gewerkId)
    .sort((a, b) => (a.anbieter || '').localeCompare(b.anbieter || '', 'de', { sensitivity: 'base' }));
  const [editing, setEditing] = useState(null); // null | 'new' | angebot
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  return (
    <div className="offer-table-wrap">
      <div className="offer-table-header">
        <h3 className="subsection-title">Angebote ({angebote.length})</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>+ Angebot</button>
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
                <th>Status</th>
                <th aria-label="Aktionen"></th>
              </tr>
            </thead>
            <tbody>
              {angebote.map((a) => {
                const stats = model.angebot(a.id);
                return (
                  <tr key={a.id} className={a.status === 'ausgewählt' ? 'row--selected' : a.status === 'abgelehnt' ? 'row--rejected' : ''}>
                    <td><strong>{a.anbieter}</strong>{a.notiz && <div className="note-cell">{a.notiz}</div>}</td>
                    <td>{a.titel || '—'}</td>
                    <td className="text-right">{formatCurrency(a.betragAngebot)}</td>
                    <td className="text-right">
                      {stats.anzahlRechnungen > 0 ? `${stats.anzahlRechnungen} · ${formatCurrency(stats.summeRechnungen)}` : '—'}
                    </td>
                    <td><Badge status={a.status} small /></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon" title="Bearbeiten" onClick={() => setEditing(a)}>✏</button>
                        <button className="btn-icon btn-icon--danger" title="Löschen" onClick={() => setDeleteConfirm(a.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Neues Angebot' : 'Angebot bearbeiten'} onClose={() => setEditing(null)}>
          <AngebotForm
            initial={editing === 'new' ? null : editing}
            onSave={(angebot) => { actions.save('angebote', { ...angebot, gewerkId }); setEditing(null); }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Angebot löschen?" onClose={() => setDeleteConfirm(null)} width={380}>
          <p>Soll dieses Angebot wirklich gelöscht werden? Zugehörige Rechnungen bleiben erhalten.</p>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Abbrechen</button>
            <button className="btn btn-danger" onClick={() => { actions.remove('angebote', deleteConfirm); setDeleteConfirm(null); }}>Löschen</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
