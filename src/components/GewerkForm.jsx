import { useState } from 'react';

const GEWERK_STATUSES = ['offen', 'angefragt', 'angeboten', 'beauftragt', 'in Arbeit', 'fertig'];

export default function GewerkForm({ initial, einheiten, kategorien, onSave, onCancel, hideCancel = false }) {
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

  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, geplantBudget: parseFloat(form.geplantBudget) || 0 }); }}>
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
      <div className="form-row">
        <label className="form-label">Geplantes Budget (€)</label>
        <input className="input" type="number" step="0.01" min="0" value={form.geplantBudget} onChange={(e) => set('geplantBudget', e.target.value)} />
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
        {!hideCancel && <button type="button" className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>}
        <button type="submit" className="btn btn-primary">Speichern</button>
      </div>
    </form>
  );
}
