import { useState } from 'react';

export default function ProjektForm({ initial, einheiten = [], kategorien = [], onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name: '', adresse: '', budget: '', notizen: '', password: '0000' });
  const [kats, setKats] = useState(kategorien);
  const [newKat, setNewKat] = useState('');
  function set(f, v) { setForm((p) => ({ ...p, [f]: v })); }
  const hasDerivedBudget = einheiten.some((e) => (e.budget || 0) > 0);

  function addKat() {
    const trimmed = newKat.trim();
    if (trimmed && !kats.includes(trimmed)) {
      setKats((k) => [...k, trimmed]);
    }
    setNewKat('');
  }

  function removeKat(k) {
    setKats((prev) => prev.filter((x) => x !== k));
  }

  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, budget: parseFloat(form.budget) || 0 }, kats); }}>
      <div className="form-row">
        <label className="form-label">Projektname *</label>
        <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="form-row">
        <label className="form-label">Adresse</label>
        <input className="input" value={form.adresse} onChange={(e) => set('adresse', e.target.value)} />
      </div>
      <div className="form-row">
        <label className="form-label">
          Budget (€)
          {hasDerivedBudget && (
            <span className="budget-derived-hint" title="Das Gesamtbudget wird aus den Einheiten-Budgets abgeleitet. Dieses Feld dient als Fallback.">
              {' '}– wird aus Einheiten abgeleitet
            </span>
          )}
        </label>
        <input
          className="input"
          type="number"
          step="100"
          min="0"
          value={form.budget}
          onChange={(e) => set('budget', e.target.value)}
          placeholder={hasDerivedBudget ? 'Fallback (optional)' : ''}
        />
      </div>
      <div className="form-row">
        <label className="form-label">Notizen</label>
        <textarea className="input textarea" rows={3} value={form.notizen} onChange={(e) => set('notizen', e.target.value)} />
      </div>
      <div className="form-row">
        <label className="form-label">Passwort</label>
        <input className="input" type="text" value={form.password || ''} onChange={(e) => set('password', e.target.value)} placeholder="Passwort (leer = kein Schutz)" />
        <span className="form-hint">Ändert das Passwort für den Zugriffsschutz. Aktuelles Cookie bleibt bis zum nächsten Login gültig.</span>
      </div>
      <div className="form-row">
        <label className="form-label">Kategorien (Gewerke)</label>
        <div className="kat-list">
          {kats.map((k) => (
            <span key={k} className="kat-tag">
              {k}
              <button type="button" className="kat-tag-remove" onClick={() => removeKat(k)} title="Entfernen">×</button>
            </span>
          ))}
        </div>
        <div className="kat-add-row">
          <input
            className="input"
            value={newKat}
            onChange={(e) => setNewKat(e.target.value)}
            placeholder="Neue Kategorie…"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKat(); } }}
          />
          <button type="button" className="btn btn-secondary btn-sm" onClick={addKat}>+ Hinzufügen</button>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn-primary">Speichern</button>
      </div>
    </form>
  );
}
