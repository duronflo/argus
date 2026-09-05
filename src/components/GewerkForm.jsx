import { useState } from 'react';

const GEWERK_STATUSES = ['offen', 'angefragt', 'angeboten', 'beauftragt', 'in Arbeit', 'fertig'];

export default function GewerkForm({ initial, einheiten, kategorien, onSave, onCancel, autoSave = false }) {
  const kats = (kategorien && kategorien.length > 0) ? kategorien : ['Sonstiges'];
  const [form, setForm] = useState(
    initial || {
      name: '',
      kategorie: kats[0] || 'Sonstiges',
      status: 'offen',
      notizen: '',
      geplantBudget: '',
      einheitIds: [],
      einheitAnteile: {},
    }
  );

  function normalize(draft) {
    return { ...draft, geplantBudget: parseFloat(draft.geplantBudget) || 0 };
  }

  function save(draft = form) {
    onSave(normalize(draft));
  }

  function set(field, val, saveImmediately = false) {
    const next = { ...form, [field]: val };
    setForm(next);
    if (autoSave && saveImmediately) save(next);
  }

  function toggleEinheit(id) {
    const ids = form.einheitIds || [];
    const newIds = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    const pct = newIds.length > 0 ? Math.round(100 / newIds.length) : 0;
    const anteile = {};
    newIds.forEach((eid, i) => {
      anteile[eid] = i === newIds.length - 1 ? 100 - pct * (newIds.length - 1) : pct;
    });
    const next = { ...form, einheitIds: newIds, einheitAnteile: anteile };
    setForm(next);
    if (autoSave) save(next);
  }

  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); if (!autoSave) save(); }}>
      <div className="form-row">
        <label className="form-label">Name *</label>
        <input
          className="input"
          required
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          onBlur={() => autoSave && save()}
        />
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label className="form-label">Kategorie</label>
          <select className="select" value={form.kategorie} onChange={(e) => set('kategorie', e.target.value, true)}>
            {kats.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label className="form-label">Status</label>
          <select className="select" value={form.status} onChange={(e) => set('status', e.target.value, true)}>
            {GEWERK_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row">
        <label className="form-label">Geplantes Budget (€)</label>
        <input
          className="input"
          type="number"
          step="0.01"
          min="0"
          value={form.geplantBudget}
          onChange={(e) => set('geplantBudget', e.target.value)}
          onBlur={() => autoSave && save()}
        />
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
        <textarea
          className="input textarea"
          rows={3}
          value={form.notizen}
          onChange={(e) => set('notizen', e.target.value)}
          onBlur={() => autoSave && save()}
        />
      </div>
      {autoSave ? (
        <p className="form-autosave-hint">✓ Änderungen werden automatisch gespeichert.</p>
      ) : (
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
          <button type="submit" className="btn btn-primary">Speichern</button>
        </div>
      )}
    </form>
  );
}
