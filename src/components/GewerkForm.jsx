import { useState } from 'react';
import { equalSplit } from '../domain/migrate';
import { GEWERK_STATUSES, statusLabel } from '../domain/constants';

export default function GewerkForm({ initial, einheiten, kategorien, onSave, onCancel, autoSave = false, budgetHinweis = null }) {
  const kats = (kategorien && kategorien.length > 0) ? kategorien : ['Sonstiges'];
  const [form, setForm] = useState(
    initial || {
      name: '',
      kategorie: kats[0] || 'Sonstiges',
      status: 'offen',
      notizen: '',
      geplantBudget: '',
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

  const einheitIds = Object.keys(form.einheitAnteile || {});

  function toggleEinheit(id) {
    const newIds = einheitIds.includes(id) ? einheitIds.filter((x) => x !== id) : [...einheitIds, id];
    const next = { ...form, einheitAnteile: equalSplit(newIds) };
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
              <option key={s} value={s}>{statusLabel(s)}</option>
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
        {budgetHinweis && <span className="form-hint">{budgetHinweis}</span>}
      </div>
      {einheiten && einheiten.length > 0 && (
        <div className="form-row">
          <label className="form-label">Einheiten (Kostenstellen)</label>
          <div className="einheit-checkboxes">
            {einheiten.map((eh) => (
              <label key={eh.id} className="einheit-checkbox-item">
                <input
                  type="checkbox"
                  checked={einheitIds.includes(eh.id)}
                  onChange={() => toggleEinheit(eh.id)}
                />
                <span>{eh.name}</span>
              </label>
            ))}
          </div>
          {einheitIds.length === 0 && (
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
