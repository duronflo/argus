import { useState } from 'react';
import TradeList from './TradeList';
import Modal from './Modal';
import GewerkForm from './GewerkForm';
import { useProject } from '../state/ProjectContext';

export default function GewerkeDetails() {
  const { data, actions } = useProject();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const kats = data.kategorien?.length > 0 ? data.kategorien : ['Sonstiges'];

  function handleAddGewerk(gewerk) {
    const id = actions.save('gewerke', gewerk);
    setShowAddForm(false);
    actions.openGewerk(id);
  }

  return (
    <div className="gewerke-details">
      <TradeList onAdd={() => setShowAddForm(true)} onDelete={setDeleteConfirm} />

      {showAddForm && (
        <Modal title="Neues Gewerk" onClose={() => setShowAddForm(false)}>
          <GewerkForm
            einheiten={data.einheiten}
            kategorien={kats}
            onSave={handleAddGewerk}
            onCancel={() => setShowAddForm(false)}
          />
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Gewerk löschen?" onClose={() => setDeleteConfirm(null)} width={380}>
          <p>Soll dieses Gewerk inkl. aller Angebote und Rechnungen wirklich gelöscht werden?</p>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Abbrechen</button>
            <button className="btn btn-danger" onClick={() => { actions.remove('gewerke', deleteConfirm); setDeleteConfirm(null); }}>Löschen</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
