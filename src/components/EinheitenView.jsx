import { useMemo, useState } from 'react';
import Modal from './Modal';
import { formatCurrency } from '../utils/dateUtils';
import { calcEinheitGewerkStats, calcEinheitStats } from '../utils/calculations';
import { generateId } from '../utils/dateUtils';
import BudgetOverview from './BudgetOverview';
import PieChart from './PieChart';
import { colorForKey } from '../utils/colors';
import TradeDetail from './TradeDetail';

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
  kategorien,
  onAddEinheit,
  onEditEinheit,
  onDeleteEinheit,
  onEditGewerk,
  onAddAngebot,
  onEditAngebot,
  onDeleteAngebot,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [tradeSortOrder, setTradeSortOrder] = useState('planned-desc');
  const [selectedGewerkId, setSelectedGewerkId] = useState(null);
  const sortedEinheiten = [...einheiten].sort((a, b) => {
    const direction = sortOrder === 'name-desc' ? -1 : 1;
    if (sortOrder.startsWith('budget-')) return direction * ((a.budget || 0) - (b.budget || 0));
    return direction * a.name.localeCompare(b.name, 'de', { sensitivity: 'base' });
  });

  const budgetCharts = useMemo(() => {
    const unitStats = einheiten.map((eh) => ({
      ...eh,
      stats: calcEinheitStats(eh, gewerke, angebote),
    }));
    return [
      {
        title: 'Gesamt-Budget',
        emptyText: 'Noch keine Einheiten-Budgets vorhanden.',
        segments: unitStats.map((eh) => ({ label: eh.name, value: eh.budget || 0, color: colorForKey(eh.id) })),
      },
      {
        title: 'Geplant',
        emptyText: 'Noch keine geplanten Kosten vorhanden.',
        segments: unitStats.map((eh) => ({ label: eh.name, value: eh.stats.sumGeplant, color: colorForKey(eh.id) })),
      },
      {
        title: 'Bezahlt',
        emptyText: 'Noch keine bezahlten Kosten vorhanden.',
        segments: unitStats.map((eh) => ({ label: eh.name, value: eh.stats.sumBezahlt, color: colorForKey(eh.id) })),
      },
    ];
  }, [einheiten, gewerke, angebote]);

  const unitGewerke = useMemo(() => {
    const result = new Map();
    einheiten.forEach((eh) => {
      const trades = gewerke
        .filter((g) => (g.einheitIds || []).includes(eh.id))
        .map((g) => ({
          gewerk: g,
          stats: calcEinheitGewerkStats(eh.id, g, angebote),
        }));
      result.set(eh.id, trades);
    });
    return result;
  }, [einheiten, gewerke, angebote]);

  function sortTrades(trades) {
    const direction = tradeSortOrder.endsWith('-desc') ? -1 : 1;
    return [...trades].sort((a, b) => {
      if (tradeSortOrder.startsWith('planned-')) {
        return direction * (a.stats.sumGeplant - b.stats.sumGeplant);
      }
      if (tradeSortOrder.startsWith('paid-')) {
        return direction * (a.stats.sumBezahlt - b.stats.sumBezahlt);
      }
      return direction * a.gewerk.name.localeCompare(b.gewerk.name, 'de', { sensitivity: 'base' });
    });
  }

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
        <select className="select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} aria-label="Einheiten sortieren">
          <option value="name-asc">Name (A–Z)</option>
          <option value="name-desc">Name (Z–A)</option>
          <option value="budget-asc">Budget (aufsteigend)</option>
          <option value="budget-desc">Budget (absteigend)</option>
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
            const stats = calcEinheitStats(eh, gewerke, angebote);
            const budgetOver = eh.budget > 0 && stats.sumGeplant > eh.budget;
            const trades = sortTrades(unitGewerke.get(eh.id) || []);
            const maxTradePlanned = trades.reduce((max, item) => Math.max(max, item.stats.sumGeplant), 0);

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
                    <span className={`einheit-stat-value${budgetOver ? ' warn-text' : ''}`}>{formatCurrency(stats.sumGeplant)}</span>
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

                <BudgetOverview
                  budget={eh.budget}
                  planned={stats.sumGeplant}
                  paid={stats.sumBezahlt}
                />

                <div className="einheit-trades">
                  <div className="einheit-trades-header">
                    <h4 className="subsection-title">Gewerke</h4>
                    <select
                      className="select select-sm einheit-trades-sort"
                      value={tradeSortOrder}
                      onChange={(e) => setTradeSortOrder(e.target.value)}
                      aria-label={`${eh.name}: Gewerke sortieren`}
                    >
                      <option value="planned-desc">Geplant (absteigend)</option>
                      <option value="planned-asc">Geplant (aufsteigend)</option>
                      <option value="paid-desc">Bezahlt (absteigend)</option>
                      <option value="paid-asc">Bezahlt (aufsteigend)</option>
                      <option value="name-asc">Name (A–Z)</option>
                      <option value="name-desc">Name (Z–A)</option>
                    </select>
                  </div>
                  {trades.length === 0 ? (
                    <p className="empty-state einheit-trades-empty">Keine Gewerke zugewiesen.</p>
                  ) : (
                    <div className="einheit-trade-list">
                      {trades.map(({ gewerk, stats: tradeStats }) => {
                        const width = maxTradePlanned > 0
                          ? Math.min((tradeStats.sumGeplant / maxTradePlanned) * 100, 100)
                          : 0;
                        return (
                          <button
                            type="button"
                            className="einheit-trade-row"
                            key={gewerk.id}
                            onClick={() => setSelectedGewerkId(gewerk.id)}
                            title="Gewerk öffnen und bearbeiten"
                          >
                            <span className="einheit-trade-label">
                              <span className="einheit-trade-name">{gewerk.name}</span>
                              <span className="einheit-trade-amount">{formatCurrency(tradeStats.sumGeplant)}</span>
                            </span>
                            <span className="einheit-trade-bar">
                              <span className="einheit-trade-bar-fill" style={{ width: `${width}%` }} />
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

      {selectedGewerkId && gewerke.some((g) => g.id === selectedGewerkId) && (
        <Modal
          title={gewerke.find((g) => g.id === selectedGewerkId).name}
          onClose={() => setSelectedGewerkId(null)}
          width={820}
        >
          <TradeDetail
            gewerk={gewerke.find((g) => g.id === selectedGewerkId)}
            angebote={angebote.filter((a) => a.gewerkId === selectedGewerkId)}
            einheiten={einheiten}
            kategorien={kategorien}
            onEditGewerk={onEditGewerk}
            onAddAngebot={(data) => onAddAngebot({
              ...data,
              id: generateId('ao'),
              gewerkId: selectedGewerkId,
            })}
            onEditAngebot={onEditAngebot}
            onDeleteAngebot={onDeleteAngebot}
          />
        </Modal>
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
