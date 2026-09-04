import { useMemo } from 'react';
import { calcGesamtStats, calcEinheitStats, calcProjectBudget, isProjectBudgetDerived, sumGeplant } from '../utils/calculations';
import { formatCurrency } from '../utils/dateUtils';
import BudgetOverview from './BudgetOverview';
import { FINISHED_BAR_COLOR, PLANNED_BAR_COLOR } from '../utils/colors';

function KpiCard({ label, value, sub, warn }) {
  return (
    <div className={`kpi-card${warn ? ' kpi-card--warn' : ''}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard({ projekt, gewerke, angebote, einheiten, onNavigate }) {
  const stats = useMemo(() => calcGesamtStats(angebote), [angebote]);
  const planned = useMemo(() => sumGeplant(gewerke, angebote), [gewerke, angebote]);
  const effectiveBudget = useMemo(() => calcProjectBudget(projekt, einheiten), [projekt, einheiten]);
  const budgetDerived = useMemo(() => isProjectBudgetDerived(einheiten), [einheiten]);

  const offeneAngebote = angebote.filter((a) => a.status === 'offen').length;
  const gewerkCount = gewerke.length;

  const gewerkeByStatus = useMemo(() => {
    const map = {};
    gewerke.forEach((g) => {
      map[g.status] = (map[g.status] || 0) + 1;
    });
    return map;
  }, [gewerke]);

  const einheitenStats = useMemo(() => {
    if (!einheiten || einheiten.length === 0) return [];
    return einheiten.map((eh) => ({
      ...eh,
      stats: calcEinheitStats(eh, gewerke, angebote),
    }));
  }, [einheiten, gewerke, angebote]);

  return (
    <div className="dashboard">
      <h2 className="section-title">Dashboard</h2>

      <div className="kpi-grid">
        <KpiCard
          label="Gewerke gesamt"
          value={gewerkCount}
          sub={`${gewerkeByStatus['fertig'] || 0} fertig · ${gewerkeByStatus['in Arbeit'] || 0} in Arbeit`}
        />
        <KpiCard
          label="Offene Angebote"
          value={offeneAngebote}
          sub="Noch nicht entschieden"
        />
        <KpiCard
          label="Geplant"
          value={formatCurrency(planned)}
          sub={effectiveBudget > 0 ? `von ${formatCurrency(effectiveBudget)} Budget${budgetDerived ? ' (aus Einheiten)' : ''}` : undefined}
          warn={effectiveBudget > 0 && planned > effectiveBudget}
        />
        <KpiCard
          label="Bezahlt"
          value={formatCurrency(stats.sumBezahlt)}
          sub={planned > 0 ? `Offen: ${formatCurrency(Math.max(planned - stats.sumBezahlt, 0))}` : undefined}
        />
      </div>

      <div className="dashboard-section budget-overview-section">
        <h3 className="subsection-title">Budgetübersicht</h3>
        <BudgetOverview budget={effectiveBudget} planned={planned} paid={stats.sumBezahlt} />
      </div>

      {einheitenStats.length > 0 && (
        <div className="dashboard-section">
          <h3 className="subsection-title">Budget pro Einheit</h3>
          <div className="dashboard-units-grid">
            {einheitenStats.map(({ id, name, budget, stats: es }) => {
              const over = budget > 0 && es.sumGeplant > budget;
              const unitGewerke = gewerke.filter((g) => (g.einheitIds || []).includes(id));
              const allFinished = unitGewerke.length > 0 && unitGewerke.every((g) => g.status === 'fertig');
              return (
                <div
                  key={id}
                  className={`dashboard-unit-card${over ? ' dashboard-unit-card--warn' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigate('einheiten')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onNavigate('einheiten');
                    }
                  }}
                >
                  <div className="dashboard-unit-name">{name}</div>
                  <div className="dashboard-unit-row">
                    <span className="dashboard-unit-label">Budget</span>
                    <span className="dashboard-unit-value">{budget > 0 ? formatCurrency(budget) : '—'}</span>
                  </div>
                  <div className="dashboard-unit-row">
                    <span className="dashboard-unit-label">Geplant</span>
                    <span className={`dashboard-unit-value${over ? ' warn-text' : ''}`}>{formatCurrency(es.sumGeplant)}</span>
                  </div>
                  <div className="dashboard-unit-row">
                    <span className="dashboard-unit-label">Bezahlt</span>
                    <span className="dashboard-unit-value">{formatCurrency(es.sumBezahlt)}</span>
                  </div>
                  {budget > 0 && (
                    <div className="budget-bar" style={{ marginTop: 6 }}>
                      <div
                        className="budget-bar-fill"
                        style={{
                          width: `${Math.min((es.sumGeplant / budget) * 100, 100)}%`,
                          background: over ? '#dc2626' : allFinished ? FINISHED_BAR_COLOR : PLANNED_BAR_COLOR,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
