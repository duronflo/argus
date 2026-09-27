import { useState } from 'react';
import { formatCurrency } from '../utils/dateUtils';
import { useProject } from '../state/ProjectContext';
import Badge from './Badge';
import Modal from './Modal';
import SortTh from './SortHeader';
import { sortBy, useSort } from '../utils/sort';
import { ANGEBOT_STATUSES, statusLabel } from '../domain/constants';

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
              <option key={s} value={s}>{statusLabel(s)}</option>
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
  const sorting = useSort({ key: 'anbieter', dir: 'asc' });
  const angebote = sortBy(data.angebote.filter((a) => a.gewerkId === gewerkId), sorting.sort, {
    anbieter: (a) => a.anbieter,
    titel: (a) => a.titel,
    betrag: (a) => a.betragAngebot || 0,
    rechnungen: (a) => model.angebot(a.id).summeRechnungen,
    status: (a) => ANGEBOT_STATUSES.indexOf(a.status),
  });
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
          <table className="table table--stack">
            <thead>
              <tr>
                <SortTh label="Anbieter" column="anbieter" sorting={sorting} />
                <SortTh label="Titel" column="titel" sorting={sorting} />
                <SortTh label="Angebot" column="betrag" sorting={sorting} firstDir="desc" className="text-right" />
                <SortTh label="Rechnungen" column="rechnungen" sorting={sorting} firstDir="desc" className="text-right" />
                <SortTh label="Status" column="status" sorting={sorting} />
                <th aria-label="Aktionen"></th>
              </tr>
            </thead>
            <tbody>
              {angebote.map((a) => {
                const stats = model.angebot(a.id);
                return (
                  <tr key={a.id} className={a.status === 'ausgewählt' ? 'row--selected' : a.status === 'abgelehnt' ? 'row--rejected' : ''}>
                    <td className="cell-title"><strong>{a.anbieter}</strong>{a.notiz && <div className="note-cell">{a.notiz}</div>}</td>
                    <td data-label="Titel">{a.titel || '—'}</td>
                    <td data-label="Angebot" className="text-right cell-amount">{formatCurrency(a.betragAngebot)}</td>
                    <td data-label="Rechnungen" className="text-right">
                      {stats.anzahlRechnungen > 0 ? `${stats.anzahlRechnungen} · ${formatCurrency(stats.summeRechnungen)}` : '—'}
                    </td>
                    <td data-label="Status"><Badge status={a.status} small /></td>
                    <td className="cell-actions">
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
