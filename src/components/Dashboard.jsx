import { useMemo } from 'react';
import { calcGesamtStats, calcProjectBudget, isProjectBudgetDerived, sumGeplant } from '../utils/calculations';
import { formatCurrency } from '../utils/dateUtils';
import Badge from './Badge';
import CategoryTag from './CategoryTag';
import BudgetOverview from './BudgetOverview';

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
  const planned = useMemo(() => sumGeplant(gewerke), [gewerke]);
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
          sub={planned > 0 ? `Offen: ${formatCurrency(planned - stats.sumBezahlt)}` : undefined}
        />
      </div>

      <div className="dashboard-section budget-overview-section">
        <h3 className="subsection-title">Budgetübersicht</h3>
        <BudgetOverview budget={effectiveBudget} planned={planned} paid={stats.sumBezahlt} />
      </div>

      <div className="dashboard-section">
        <h3 className="subsection-title">Gewerke-Übersicht</h3>
        <div className="gewerk-overview-list">
          {gewerke.length === 0 ? (
            <p className="empty-state">Keine Gewerke angelegt.</p>
          ) : (
            gewerke.map((g) => {
              const assignedUnits = einheiten
                ? einheiten.filter((eh) => (g.einheitIds || []).includes(eh.id))
                : [];
              return (
                <div
                  key={g.id}
                  className="gewerk-overview-item"
                  onClick={() => onNavigate('gewerke', g.id)}
                >
                  <div className="gewerk-overview-main">
                    <div className="gewerk-overview-name-row">
                      <span className="gewerk-overview-name">{g.name}</span>
                      <CategoryTag kategorie={g.kategorie} small />
                    </div>
                    {assignedUnits.length > 0 && (
                      <div className="gewerk-overview-units">
                        {assignedUnits.map((eh) => (
                          <span key={eh.id} className="einheit-tag einheit-tag--sm">{eh.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="gewerk-overview-right">
                    <Badge status={g.status} small />
                    {g.geplantBudget > 0 && (
                      <span className="gewerk-overview-amount">
                        {formatCurrency(g.geplantBudget)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
