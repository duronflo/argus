import { useMemo, useState } from 'react';
import Modal from './Modal';
import { formatCurrency } from '../utils/dateUtils';
import BudgetOverview from './BudgetOverview';
import PieChart from './PieChart';
import { colorForKey, getGewerkBarColor } from '../utils/colors';
import Badge, { GewerkPaymentBadge } from './Badge';
import { useProject } from '../state/ProjectContext';

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

export default function EinheitenView() {
  const { data, model, actions } = useProject();
  const { einheiten, gewerke } = data;
  const [showAddForm, setShowAddForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [tradeSortOrder, setTradeSortOrder] = useState('planned-desc');
  const sortedEinheiten = [...einheiten].sort((a, b) => {
    const direction = sortOrder === 'name-desc' ? -1 : 1;
    if (sortOrder.startsWith('budget-')) return direction * ((a.budget || 0) - (b.budget || 0));
    return direction * a.name.localeCompare(b.name, 'de', { sensitivity: 'base' });
  });

  const budgetCharts = useMemo(() => {
    const unitStats = einheiten.map((eh) => ({ ...eh, stats: model.einheit(eh.id) }));
    return [
      {
        title: 'Gesamt-Budget',
        emptyText: 'Noch keine Einheiten-Budgets vorhanden.',
        segments: unitStats.map((eh) => ({ label: eh.name, value: eh.budget || 0, color: colorForKey(eh.id) })),
      },
      {
        title: 'Geplant',
        emptyText: 'Noch keine geplanten Kosten vorhanden.',
        segments: unitStats.map((eh) => ({ label: eh.name, value: eh.stats.geplant, color: colorForKey(eh.id) })),
      },
      {
        title: 'Bezahlt',
        emptyText: 'Noch keine bezahlten Kosten vorhanden.',
        segments: unitStats.map((eh) => ({ label: eh.name, value: eh.stats.bezahlt, color: colorForKey(eh.id) })),
      },
    ];
  }, [einheiten, model]);

  // Per-unit share of each trade, as computed by the model.
  function unitTrades(einheitId) {
    return model.einheit(einheitId).gewerke
      .map((stats) => ({ gewerk: gewerke.find((g) => g.id === stats.gewerkId), stats }))
      .filter((t) => t.gewerk);
  }

  function sortTrades(trades) {
    const direction = tradeSortOrder.endsWith('-desc') ? -1 : 1;
    return [...trades].sort((a, b) => {
      if (tradeSortOrder.startsWith('planned-')) {
        return direction * (a.stats.geplant - b.stats.geplant);
      }
      if (tradeSortOrder.startsWith('paid-')) {
        return direction * (a.stats.bezahlt - b.stats.bezahlt);
      }
      return direction * a.gewerk.name.localeCompare(b.gewerk.name, 'de', { sensitivity: 'base' });
    });
  }

  function handleAdd(einheit) {
    actions.save('einheiten', einheit);
    setShowAddForm(false);
  }

  function handleEdit(einheit) {
    actions.save('einheiten', { ...editItem, ...einheit });
    setEditItem(null);
  }

  return (
    <div className="einheiten-view">
      <div className="einheiten-header">
        <h2 className="section-title">Einheiten / Kostenstellen</h2>
        <select className="select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} aria-label="Einheiten sortieren">
          <option value="name-asc">Name (A–Z)</option>
          <option value="name-desc">Name (Z–A)</option>
          <option value="budget-asc">Budget (aufsteigend)</option>
          <option value="budget-desc">Budget (absteigend)</option>
        </select>
        <select className="select" value={tradeSortOrder} onChange={(e) => setTradeSortOrder(e.target.value)} aria-label="Gewerke in den Einheiten sortieren">
          <option value="planned-desc">Gewerke: Geplant (absteigend)</option>
          <option value="planned-asc">Gewerke: Geplant (aufsteigend)</option>
          <option value="paid-desc">Gewerke: Bezahlt (absteigend)</option>
          <option value="paid-asc">Gewerke: Bezahlt (aufsteigend)</option>
          <option value="name-asc">Gewerke: Name (A–Z)</option>
          <option value="name-desc">Gewerke: Name (Z–A)</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>+ Neue Einheit</button>
      </div>

      {einheiten.length > 0 && (
        <div className="dashboard-section budget-overview-section">
          <h3 className="subsection-title">Budgetverteilung</h3>
          <div className="einheiten-budget-charts">
            {budgetCharts.map(({ title, segments, emptyText }) => (
              <div className="einheiten-budget-chart" key={title}>
                <h4 className="einheiten-budget-chart-title">{title}</h4>
                <PieChart segments={segments} emptyText={emptyText} />
              </div>
            ))}
          </div>
        </div>
      )}

      {einheiten.length === 0 ? (
        <p className="empty-state">Noch keine Einheiten angelegt. Füge Einheiten hinzu, um Gewerke und Budgets getrennt zu verfolgen.</p>
      ) : (
        <div className="einheiten-list">
          {sortedEinheiten.map((eh) => {
            const stats = model.einheit(eh.id);
            const budgetOver = eh.budget > 0 && stats.geplant > eh.budget;
            const trades = sortTrades(unitTrades(eh.id));
            const maxTradePlanned = trades.reduce((max, item) => Math.max(max, item.stats.geplant), 0);

            return (
              <div key={eh.id} className={`einheit-card${budgetOver ? ' einheit-card--warn' : ''}`}>
                <div className="einheit-card-header">
                  <div className="einheit-card-title-row">
                    <h3 className="einheit-card-name">{eh.name}</h3>
                    <span className="einheit-card-gewerke">{trades.length} Gewerk{trades.length !== 1 ? 'e' : ''}</span>
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
                    <span className="einheit-stat-label">Geplant</span>
                    <span className={`einheit-stat-value${budgetOver ? ' warn-text' : ''}`}>{formatCurrency(stats.geplant)}</span>
                  </div>
                  <div className="einheit-stat">
                    <span className="einheit-stat-label">Bezahlt</span>
                    <span className="einheit-stat-value">{formatCurrency(stats.bezahlt)}</span>
                  </div>
                  <div className="einheit-stat">
                    <span className="einheit-stat-label">Offen</span>
                    <span className="einheit-stat-value">{formatCurrency(stats.offen)}</span>
                  </div>
                </div>

                <BudgetOverview
                  budget={eh.budget}
                  planned={stats.geplant}
                  paid={stats.bezahlt}
                />

                <div className="einheit-trades">
                  <div className="einheit-trades-header">
                    <h4 className="subsection-title">Gewerke</h4>
                  </div>
                  {trades.length === 0 ? (
                    <p className="empty-state einheit-trades-empty">Keine Gewerke zugewiesen.</p>
                  ) : (
                    <div className="einheit-trade-list">
                      {trades.map(({ gewerk, stats: tradeStats }) => {
                        const width = maxTradePlanned > 0
                          ? Math.min((tradeStats.geplant / maxTradePlanned) * 100, 100)
                          : 0;
                        return (
                          <button
                            type="button"
                            className="einheit-trade-row"
                            key={gewerk.id}
                            onClick={() => actions.openGewerk(gewerk.id)}
                            title="Gewerk öffnen und bearbeiten"
                          >
                            <span className="einheit-trade-label">
                              <span className="einheit-trade-heading">
                                <span className="einheit-trade-name">{gewerk.name}</span>
                                <span className="einheit-trade-amount">{formatCurrency(tradeStats.geplant)}</span>
                              </span>
                              <span className="einheit-trade-status">
                                <Badge status={gewerk.status} small />
                                <GewerkPaymentBadge zahlstatus={model.gewerk(gewerk.id).zahlstatus} small />
                              </span>
                            </span>
                            <span className="einheit-trade-bar">
                              <span
                                className="einheit-trade-bar-fill"
                                style={{
                                  width: `${width}%`,
                                  background: getGewerkBarColor(gewerk.status, model.gewerk(gewerk.id).zahlstatus),
                                }}
                              />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
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
            <button className="btn btn-danger" onClick={() => { actions.remove('einheiten', deleteConfirm); setDeleteConfirm(null); }}>Löschen</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
