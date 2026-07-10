import { useState } from 'react';
import Badge from './Badge';
import OfferTable from './OfferTable';
import Modal from './Modal';
import { formatDate, isOverdue } from '../utils/dateUtils';

const GEWERK_STATUSES = ['offen', 'angefragt', 'angeboten', 'beauftragt', 'in Arbeit', 'fertig'];

function GewerkForm({ initial, einheiten, kategorien, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      name: '',
      kategorie: (kategorien && kategorien[0]) || 'Sonstiges',
      status: 'offen',
      notizen: '',
      geplanterStart: '',
      geplantesEnde: '',
      tatsaechlicherStart: '',
      tatsaechlichesEnde: '',
      einheitIds: [],
      einheitAnteile: {},
    }
  );

  function set(field, val) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  function toggleEinheit(id) {
    setForm((p) => {
      const ids = p.einheitIds || [];
      const newIds = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
      const pct = newIds.length > 0 ? Math.round(100 / newIds.length) : 0;
      const anteile = {};
      newIds.forEach((eid, i) => {
        anteile[eid] = i === newIds.length - 1 ? 100 - pct * (newIds.length - 1) : pct;
      });
      return { ...p, einheitIds: newIds, einheitAnteile: anteile };
    });
  }

  const kats = (kategorien && kategorien.length > 0) ? kategorien : ['Sonstiges'];

  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <div className="form-row">
        <label className="form-label">Name *</label>
        <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label className="form-label">Kategorie</label>
          <select className="select" value={form.kategorie} onChange={(e) => set('kategorie', e.target.value)}>
            {kats.map((k) => <option key={k} value={k}>{k}</option>)}
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
      {einheiten && einheiten.length > 0 && (
        <div className="form-row">
          <label className="form-label">Einheiten (Kostenstellen)</label>
          <div className="einheit-checkboxes">
            {einheiten.map((eh) => (
              <label key={eh.id} className="einheit-checkbox-item">
                <input
                  type="checkbox"
                  checked={(form.einheitIds || []).includes(eh.id)}
                  onChange={() => toggleEinheit(eh.id)}
                />
                <span>{eh.name}</span>
              </label>
            ))}
          </div>
          {(form.einheitIds || []).length === 0 && (
            <span className="form-hint">Keine Zuweisung = allgemeines Gewerk (projekt-weit)</span>
          )}
        </div>
      )}
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

function EinheitAnteileEditor({ gewerk, einheiten, onUpdate }) {
  const ids = gewerk.einheitIds || [];
  const anteile = gewerk.einheitAnteile || {};

  if (ids.length === 0) return null;

  const assignedEinheiten = einheiten.filter((eh) => ids.includes(eh.id));

  function handleSliderChange(id, val) {
    const newVal = Math.max(0, Math.min(100, Number(val)));
    const rest = ids.filter((x) => x !== id);
    const oldSum = rest.reduce((s, x) => s + (anteile[x] || 0), 0);
    const newSum = 100 - newVal;
    const newAnteile = { ...anteile, [id]: newVal };
    if (oldSum > 0) {
      rest.forEach((x, i) => {
        const share = i === rest.length - 1
          ? newSum - rest.slice(0, -1).reduce((s, y) => s + newAnteile[y], 0)
          : Math.round(((anteile[x] || 0) / oldSum) * newSum);
        newAnteile[x] = Math.max(0, share);
      });
    } else if (rest.length > 0) {
      const perItem = Math.round(newSum / rest.length);
      rest.forEach((x, i) => {
        newAnteile[x] = i === rest.length - 1
          ? newSum - perItem * (rest.length - 1)
          : perItem;
      });
    }
    onUpdate({ ...gewerk, einheitAnteile: newAnteile });
  }

  function handleTextChange(id, raw) {
    const val = parseInt(raw, 10);
    if (!isNaN(val)) handleSliderChange(id, val);
  }

  function resetEqual() {
    const pct = Math.round(100 / ids.length);
    const newAnteile = {};
    ids.forEach((id, i) => {
      newAnteile[id] = i === ids.length - 1 ? 100 - pct * (ids.length - 1) : pct;
    });
    onUpdate({ ...gewerk, einheitAnteile: newAnteile });
  }

  const total = ids.reduce((s, id) => s + (anteile[id] || 0), 0);

  return (
    <div className="anteile-editor">
      <div className="anteile-header">
        <span className="meta-label">Kostenverteilung auf Einheiten</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={resetEqual}>⟳ Gleich verteilen</button>
      </div>
      {assignedEinheiten.map((eh) => {
        const val = anteile[eh.id] ?? 0;
        return (
          <div key={eh.id} className="anteile-row">
            <span className="anteile-name">{eh.name}</span>
            <input
              type="range"
              className="anteile-slider"
              min={0}
              max={100}
              value={val}
              onChange={(e) => handleSliderChange(eh.id, e.target.value)}
            />
            <input
              type="number"
              className="input anteile-input"
              min={0}
              max={100}
              value={val}
              onChange={(e) => handleTextChange(eh.id, e.target.value)}
            />
            <span className="anteile-pct">%</span>
          </div>
        );
      })}
      {total !== 100 && (
        <p className="anteile-warn">Summe: {total}% (sollte 100% ergeben)</p>
      )}
    </div>
  );
}

export default function TradeDetail({
  gewerk,
  angebote,
  einheiten,
  kategorien,
  onEditGewerk,
  onAddAngebot,
  onEditAngebot,
  onDeleteAngebot,
}) {
  const [showEditForm, setShowEditForm] = useState(false);
  const overdue = isOverdue(gewerk.geplantesEnde, gewerk.status);

  const assignedEinheiten = einheiten
    ? einheiten.filter((eh) => (gewerk.einheitIds || []).includes(eh.id))
    : [];

  const kats = (kategorien && kategorien.length > 0) ? kategorien : ['Sonstiges'];

  return (
    <div className="trade-detail">
      <div className="trade-detail-header">
        <div>
          <h2 className="trade-detail-title">{gewerk.name}</h2>
          <span className="trade-detail-kat">{gewerk.kategorie}</span>
          {assignedEinheiten.length > 0 && (
            <div className="trade-detail-units">
              {assignedEinheiten.map((eh) => (
                <span key={eh.id} className="einheit-tag">{eh.name}</span>
              ))}
            </div>
          )}
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

      {assignedEinheiten.length > 0 && (
        <EinheitAnteileEditor
          gewerk={gewerk}
          einheiten={einheiten}
          onUpdate={onEditGewerk}
        />
      )}

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
            einheiten={einheiten}
            kategorien={kats}
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
