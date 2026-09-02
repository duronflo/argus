import { useState } from 'react';
import TradeList from './TradeList';
import TradeDetail from './TradeDetail';
import Modal from './Modal';
import GewerkForm from './GewerkForm';
import { generateId } from '../utils/dateUtils';

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
  onReorderGewerke,
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
      <TradeList
        gewerke={gewerke}
        angebote={angebote}
        einheiten={einheiten}
        selectedId={selectedGewerkId}
        onSelect={onSelectGewerk}
        onAdd={() => setShowAddForm(true)}
        onDelete={handleDeleteGewerk}
        onReorder={onReorderGewerke}
      />

      {selectedGewerk && (
        <Modal title={selectedGewerk.name} onClose={() => onSelectGewerk(null)} width={820}>
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
        </Modal>
      )}

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
