import { useState } from 'react';
import Modal from './Modal';
import { formatCurrency } from '../utils/dateUtils';
import { calcEinheitStats } from '../utils/calculations';
import { generateId } from '../utils/dateUtils';

function EinheitForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { name: '', budget: '', notizen: '' }
  );
  function set(f, v) { setForm((p) => ({ ...p, [f]: v })); }
  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, budget: parseFloat(form.budget) || 0 }); }}>
      <div className="form-row">
        <label className="form-label">Name *</label>
        <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="z.B. Erdgeschoss" />
      </div>
      <div className="form-row">
        <label className="form-label">Budget (€)</label>
        <input className="input" type="number" step="100" min="0" value={form.budget} onChange={(e) => set('budget', e.target.value)} />
      </div>
      <div className="form-row">
        <label className="form-label">Notizen</label>
        <textarea className="input textarea" rows={2} value={form.notizen} onChange={(e) => set('notizen', e.target.value)} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn-primary">Speichern</button>
      </div>
    </form>
  );
}

export default function EinheitenView({
  einheiten,
  gewerke,
  angebote,
  onAddEinheit,
  onEditEinheit,
  onDeleteEinheit,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  function handleAdd(data) {
    onAddEinheit({ ...data, id: generateId('eh') });
    setShowAddForm(false);
  }

  function handleEdit(data) {
    onEditEinheit({ ...editItem, ...data });
    setEditItem(null);
  }

  return (
    <div className="einheiten-view">
      <div className="einheiten-header">
        <h2 className="section-title">Einheiten / Kostenstellen</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>+ Neue Einheit</button>
      </div>

      {einheiten.length === 0 ? (
        <p className="empty-state">Noch keine Einheiten angelegt. Füge Einheiten hinzu, um Gewerke und Budgets getrennt zu verfolgen.</p>
      ) : (
        <div className="einheiten-list">
          {einheiten.map((eh) => {
            const stats = calcEinheitStats(eh, gewerke, angebote);
            const budgetPct = eh.budget > 0 ? Math.min((stats.sumBeauftragt / eh.budget) * 100, 100) : 0;
            const budgetOver = eh.budget > 0 && stats.sumBeauftragt > eh.budget;
            const unitGewerkeCount = gewerke.filter(
              (g) => g.einheitIds && g.einheitIds.includes(eh.id)
            ).length;

            return (
              <div key={eh.id} className={`einheit-card${budgetOver ? ' einheit-card--warn' : ''}`}>
                <div className="einheit-card-header">
                  <div className="einheit-card-title-row">
                    <h3 className="einheit-card-name">{eh.name}</h3>
                    <span className="einheit-card-gewerke">{unitGewerkeCount} Gewerk{unitGewerkeCount !== 1 ? 'e' : ''}</span>
                  </div>
                  <div className="einheit-card-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditItem(eh)}>✏ Bearbeiten</button>
                    <button className="btn-icon btn-icon--danger" title="Löschen" onClick={() => setDeleteConfirm(eh.id)}>🗑</button>
                  </div>
                </div>

                {eh.notizen && <p className="einheit-card-notizen">{eh.notizen}</p>}

                <div className="einheit-card-stats">
                  <div className="einheit-stat">
                    <span className="einheit-stat-label">Budget</span>
                    <span className="einheit-stat-value">{eh.budget > 0 ? formatCurrency(eh.budget) : '—'}</span>
                  </div>
                  <div className="einheit-stat">
                    <span className="einheit-stat-label">Beauftragt</span>
                    <span className={`einheit-stat-value${budgetOver ? ' warn-text' : ''}`}>{formatCurrency(stats.sumBeauftragt)}</span>
                  </div>
                  <div className="einheit-stat">
                    <span className="einheit-stat-label">Bezahlt</span>
                    <span className="einheit-stat-value">{formatCurrency(stats.sumBezahlt)}</span>
                  </div>
                  <div className="einheit-stat">
                    <span className="einheit-stat-label">Offen</span>
                    <span className="einheit-stat-value">{formatCurrency(stats.sumOffen)}</span>
                  </div>
                </div>

                {eh.budget > 0 && (
                  <div className="einheit-budget-bar-wrap">
                    <div className="budget-bar-labels">
                      <span>Beauftragt: {formatCurrency(stats.sumBeauftragt)}</span>
                      <span style={{ color: budgetOver ? '#dc2626' : undefined }}>
                        Budget: {formatCurrency(eh.budget)}{budgetOver && ' ⚠ Überschritten!'}
                      </span>
                    </div>
                    <div className="budget-bar">
                      <div
                        className="budget-bar-fill"
                        style={{
                          width: `${budgetPct}%`,
                          background: budgetOver ? '#dc2626' : budgetPct > 80 ? '#d97706' : '#2563eb',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAddForm && (
        <Modal title="Neue Einheit" onClose={() => setShowAddForm(false)}>
          <EinheitForm onSave={handleAdd} onCancel={() => setShowAddForm(false)} />
        </Modal>
      )}

      {editItem && (
        <Modal title="Einheit bearbeiten" onClose={() => setEditItem(null)}>
          <EinheitForm initial={editItem} onSave={handleEdit} onCancel={() => setEditItem(null)} />
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Einheit löschen?" onClose={() => setDeleteConfirm(null)} width={380}>
          <p>Soll diese Einheit wirklich gelöscht werden? Gewerke bleiben erhalten, verlieren aber die Zuweisung zu dieser Einheit.</p>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Abbrechen</button>
            <button className="btn btn-danger" onClick={() => { onDeleteEinheit(deleteConfirm); setDeleteConfirm(null); }}>Löschen</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
