import { useState } from 'react';
import TradeList from './TradeList';
import TradeDetail from './TradeDetail';
import Modal from './Modal';
import { generateId } from '../utils/dateUtils';

const GEWERK_STATUSES = ['offen', 'angefragt', 'angeboten', 'beauftragt', 'in Arbeit', 'fertig'];

function GewerkForm({ initial, einheiten, kategorien, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      name: '',
      kategorie: kategorien[0] || 'Sonstiges',
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
  function set(f, v) { setForm((p) => ({ ...p, [f]: v })); }

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
    <form className="form" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <div className="form-row">
        <label className="form-label">Name *</label>
        <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label className="form-label">Kategorie</label>
          <select className="select" value={form.kategorie} onChange={(e) => set('kategorie', e.target.value)}>
            {kategorien.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label className="form-label">Status</label>
          <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>
            {GEWERK_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
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

export default function GewerkeDetails({
  gewerke,
  angebote,
  einheiten,
  kategorien,
  selectedGewerkId,
  onSelectGewerk,
  onAddGewerk,
  onEditGewerk,
  onDeleteGewerk,
  onAddAngebot,
  onEditAngebot,
  onDeleteAngebot,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const selectedGewerk = gewerke.find((g) => g.id === selectedGewerkId) || null;
  const selectedAngebote = angebote.filter((a) => a.gewerkId === selectedGewerkId);

  const kats = kategorien && kategorien.length > 0 ? kategorien : ['Sonstiges'];

  function handleAddGewerk(data) {
    onAddGewerk({ ...data, id: generateId('gw') });
    setShowAddForm(false);
  }

  function handleDeleteGewerk(id) {
    setDeleteConfirm(id);
  }

  function confirmDelete() {
    onDeleteGewerk(deleteConfirm);
    setDeleteConfirm(null);
  }

  return (
    <div className="gewerke-details">
      <div className="gewerke-details-split">
        <div className="gewerke-details-left">
          <TradeList
            gewerke={gewerke}
            angebote={angebote}
            einheiten={einheiten}
            selectedId={selectedGewerkId}
            onSelect={onSelectGewerk}
            onAdd={() => setShowAddForm(true)}
            onDelete={handleDeleteGewerk}
          />
        </div>
        <div className="gewerke-details-right">
          {selectedGewerk ? (
            <TradeDetail
              gewerk={selectedGewerk}
              angebote={selectedAngebote}
              einheiten={einheiten}
              kategorien={kats}
              onEditGewerk={onEditGewerk}
              onAddAngebot={(data) => onAddAngebot({ ...data, id: generateId('ao'), gewerkId: selectedGewerkId })}
              onEditAngebot={onEditAngebot}
              onDeleteAngebot={onDeleteAngebot}
            />
          ) : (
            <div className="no-selection">
              <div className="no-selection-icon">🔨</div>
              <p>Wähle ein Gewerk aus der Liste aus.</p>
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <Modal title="Neues Gewerk" onClose={() => setShowAddForm(false)}>
          <GewerkForm
            einheiten={einheiten}
            kategorien={kats}
            onSave={handleAddGewerk}
            onCancel={() => setShowAddForm(false)}
          />
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Gewerk löschen?" onClose={() => setDeleteConfirm(null)} width={380}>
          <p>Soll dieses Gewerk inkl. aller Angebote wirklich gelöscht werden?</p>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Abbrechen</button>
            <button className="btn btn-danger" onClick={confirmDelete}>Löschen</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
