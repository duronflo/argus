import { useState } from 'react';
import Badge from './Badge';
import OfferTable from './OfferTable';
import Modal from './Modal';
import { formatDate, isOverdue } from '../utils/dateUtils';

const GEWERK_STATUSES = ['offen', 'angefragt', 'angeboten', 'beauftragt', 'in Arbeit', 'fertig'];
const KATEGORIEN = ['Elektro', 'Sanitär', 'Maler', 'Boden', 'Dach', 'Heizung', 'Fenster', 'Maurer', 'Zimmerer', 'Sonstiges'];

function GewerkForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      name: '',
      kategorie: 'Sonstiges',
      status: 'offen',
      notizen: '',
      geplanterStart: '',
      geplantesEnde: '',
      tatsaechlicherStart: '',
      tatsaechlichesEnde: '',
    }
  );

  function set(field, val) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label className="form-label">Name *</label>
        <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label className="form-label">Kategorie</label>
          <select className="select" value={form.kategorie} onChange={(e) => set('kategorie', e.target.value)}>
            {KATEGORIEN.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label className="form-label">Status</label>
          <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>
            {GEWERK_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label className="form-label">Geplanter Start</label>
          <input className="input" type="date" value={form.geplanterStart} onChange={(e) => set('geplanterStart', e.target.value)} />
        </div>
        <div className="form-row">
          <label className="form-label">Geplantes Ende</label>
          <input className="input" type="date" value={form.geplantesEnde} onChange={(e) => set('geplantesEnde', e.target.value)} />
        </div>
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label className="form-label">Tats. Start</label>
          <input className="input" type="date" value={form.tatsaechlicherStart} onChange={(e) => set('tatsaechlicherStart', e.target.value)} />
        </div>
        <div className="form-row">
          <label className="form-label">Tats. Ende</label>
          <input className="input" type="date" value={form.tatsaechlichesEnde} onChange={(e) => set('tatsaechlichesEnde', e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <label className="form-label">Notizen</label>
        <textarea className="input textarea" rows={3} value={form.notizen} onChange={(e) => set('notizen', e.target.value)} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn-primary">Speichern</button>
      </div>
    </form>
  );
}

export default function TradeDetail({
  gewerk,
  angebote,
  onEditGewerk,
  onAddAngebot,
  onEditAngebot,
  onDeleteAngebot,
}) {
  const [showEditForm, setShowEditForm] = useState(false);
  const overdue = isOverdue(gewerk.geplantesEnde, gewerk.status);

  return (
    <div className="trade-detail">
      <div className="trade-detail-header">
        <div>
          <h2 className="trade-detail-title">{gewerk.name}</h2>
          <span className="trade-detail-kat">{gewerk.kategorie}</span>
        </div>
        <div className="trade-detail-actions">
          <Badge status={gewerk.status} />
          <button className="btn btn-ghost btn-sm" onClick={() => setShowEditForm(true)}>✏ Bearbeiten</button>
        </div>
      </div>

      {overdue && (
        <div className="alert alert--warn">
          ⚠ Geplantes Enddatum ({formatDate(gewerk.geplantesEnde)}) überschritten — Status ist noch &ldquo;{gewerk.status}&rdquo;.
        </div>
      )}

      <div className="trade-detail-meta">
        <div className="meta-grid">
          <div className="meta-item">
            <span className="meta-label">Geplanter Start</span>
            <span className="meta-value">{formatDate(gewerk.geplanterStart)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Geplantes Ende</span>
            <span className={`meta-value${overdue ? ' warn-text' : ''}`}>{formatDate(gewerk.geplantesEnde)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Tats. Start</span>
            <span className="meta-value">{formatDate(gewerk.tatsaechlicherStart)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Tats. Ende</span>
            <span className="meta-value">{formatDate(gewerk.tatsaechlichesEnde)}</span>
          </div>
        </div>
        {gewerk.notizen && (
          <div className="meta-notes">
            <span className="meta-label">Notizen</span>
            <p className="meta-notes-text">{gewerk.notizen}</p>
          </div>
        )}
      </div>

      <OfferTable
        angebote={angebote}
        onAddAngebot={onAddAngebot}
        onEditAngebot={onEditAngebot}
        onDeleteAngebot={onDeleteAngebot}
      />

      {showEditForm && (
        <Modal title="Gewerk bearbeiten" onClose={() => setShowEditForm(false)}>
          <GewerkForm
            initial={gewerk}
            onSave={(data) => {
              onEditGewerk({ ...gewerk, ...data });
              setShowEditForm(false);
            }}
            onCancel={() => setShowEditForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
