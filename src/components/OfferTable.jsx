import { useState } from 'react';
import { formatCurrency, formatDate } from '../utils/dateUtils';
import Badge from './Badge';
import Modal from './Modal';

const ANGEBOT_STATUSES = ['offen', 'ausgewählt', 'abgelehnt'];

function AngebotForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      anbieter: '',
      titel: '',
      betragAngebot: '',
      betragBeauftragt: '',
      bezahlt: '',
      datum: '',
      gueltigBis: '',
      status: 'offen',
      notiz: '',
    }
  );

  function set(field, val) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      ...form,
      betragAngebot: parseFloat(form.betragAngebot) || 0,
      betragBeauftragt: parseFloat(form.betragBeauftragt) || 0,
      bezahlt: parseFloat(form.bezahlt) || 0,
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
        <div className="form-row">
          <label className="form-label">Beauftragt (€)</label>
          <input className="input" type="number" step="0.01" min="0" value={form.betragBeauftragt} onChange={(e) => set('betragBeauftragt', e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <label className="form-label">Bezahlt (€)</label>
        <input className="input" type="number" step="0.01" min="0" value={form.bezahlt} onChange={(e) => set('bezahlt', e.target.value)} />
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label className="form-label">Datum</label>
          <input className="input" type="date" value={form.datum} onChange={(e) => set('datum', e.target.value)} />
        </div>
        <div className="form-row">
          <label className="form-label">Gültig bis</label>
          <input className="input" type="date" value={form.gueltigBis} onChange={(e) => set('gueltigBis', e.target.value)} />
        </div>
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

  const sumAngebote = angebote.reduce((s, a) => s + (a.betragAngebot || 0), 0);
  const sumBeauftragt = angebote.reduce((s, a) => s + (a.betragBeauftragt || 0), 0);
  const sumBezahlt = angebote.reduce((s, a) => s + (a.bezahlt || 0), 0);
  const overpaid = angebote.some((a) => a.bezahlt > a.betragBeauftragt && a.betragBeauftragt > 0);

  return (
    <div className="offer-table-wrap">
      <div className="offer-table-header">
        <h3 className="subsection-title">Angebote ({angebote.length})</h3>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditAngebot(null); setShowForm(true); }}>
          + Angebot
        </button>
      </div>

      {overpaid && (
        <div className="alert alert--warn">⚠ Bezahlt übersteigt beauftragten Betrag!</div>
      )}

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
                <th className="text-right">Beauftragt</th>
                <th className="text-right">Bezahlt</th>
                <th>Datum</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {angebote.map((a) => (
                <tr key={a.id} className={a.status === 'ausgewählt' ? 'row--selected' : a.status === 'abgelehnt' ? 'row--rejected' : ''}>
                  <td><strong>{a.anbieter}</strong></td>
                  <td>{a.titel || '—'}</td>
                  <td className="text-right">{formatCurrency(a.betragAngebot)}</td>
                  <td className="text-right">{a.betragBeauftragt > 0 ? formatCurrency(a.betragBeauftragt) : '—'}</td>
                  <td className={`text-right${a.bezahlt > a.betragBeauftragt && a.betragBeauftragt > 0 ? ' warn-text' : ''}`}>
                    {a.bezahlt > 0 ? formatCurrency(a.bezahlt) : '—'}
                  </td>
                  <td>{formatDate(a.datum)}</td>
                  <td><Badge status={a.status} small /></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn-icon" title="Bearbeiten" onClick={() => { setEditAngebot(a); setShowForm(true); }}>✏</button>
                      <button className="btn-icon btn-icon--danger" title="Löschen" onClick={() => setDeleteConfirm(a.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-foot">
                <td colSpan={2}><strong>Summen</strong></td>
                <td className="text-right"><strong>{formatCurrency(sumAngebote)}</strong></td>
                <td className="text-right"><strong>{formatCurrency(sumBeauftragt)}</strong></td>
                <td className="text-right"><strong>{formatCurrency(sumBezahlt)}</strong></td>
                <td colSpan={3}></td>
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
