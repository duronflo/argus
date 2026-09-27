import { formatCurrency } from '../utils/dateUtils';
import { useProject } from '../state/ProjectContext';
import BudgetOverview from './BudgetOverview';
import { getGewerkBarColor } from '../utils/colors';

function KpiCard({ label, value, sub, warn }) {
  return (
    <div className={`kpi-card${warn ? ' kpi-card--warn' : ''}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const { data, model } = useProject();
  const { gewerke, einheiten } = data;
  const p = model.projekt;
  const gewerkeByStatus = p.gewerkeNachStatus;

  return (
    <div className="dashboard">
      <h2 className="section-title">Dashboard</h2>

      <div className="kpi-grid">
        <KpiCard
          label="Gewerke gesamt"
          value={gewerke.length}
          sub={`${gewerkeByStatus['fertig'] || 0} fertig · ${gewerkeByStatus['in Arbeit'] || 0} in Arbeit`}
        />
        <KpiCard
          label="Offene Angebote"
          value={p.offeneAngebote}
          sub="Noch nicht entschieden"
        />
        <KpiCard
          label="Geplant"
          value={formatCurrency(p.geplant)}
          sub={p.budget > 0 ? `von ${formatCurrency(p.budget)} Budget${p.budgetAusEinheiten ? ' (aus Einheiten)' : ''}` : undefined}
          warn={p.budget > 0 && p.geplant > p.budget}
        />
        <KpiCard
          label="Bezahlt"
          value={formatCurrency(p.bezahlt)}
          sub={p.geplant > 0 ? `Offen: ${formatCurrency(p.offen)}` : undefined}
        />
      </div>

      <div className="dashboard-section budget-overview-section">
        <h3 className="subsection-title">Budgetübersicht</h3>
        <BudgetOverview budget={p.budget} planned={p.geplant} paid={p.bezahlt} />
      </div>

      {einheiten.length > 0 && (
        <div className="dashboard-section">
          <h3 className="subsection-title">Budget pro Einheit</h3>
          <div className="dashboard-units-grid">
            {einheiten.map(({ id, name, budget }) => {
              const es = model.einheit(id);
              const over = budget > 0 && es.geplant > budget;
              const unitGewerke = gewerke.filter((g) => model.gewerk(g.id).einheitIds.includes(id));
              const allFinished = unitGewerke.length > 0 && unitGewerke.every((g) => g.status === 'fertig');
              const allFinishedAndPaid = allFinished && unitGewerke.every((g) => model.gewerk(g.id).zahlstatus === 'bezahlt');
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
                    <span className={`dashboard-unit-value${over ? ' warn-text' : ''}`}>{formatCurrency(es.geplant)}</span>
                  </div>
                  <div className="dashboard-unit-row">
                    <span className="dashboard-unit-label">Bezahlt</span>
                    <span className="dashboard-unit-value">{formatCurrency(es.bezahlt)}</span>
                  </div>
                  {budget > 0 && (
                    <div className="budget-bar" style={{ marginTop: 6 }}>
                      <div
                        className="budget-bar-fill"
                        style={{
                          width: `${Math.min((es.geplant / budget) * 100, 100)}%`,
                          background: over
                            ? '#dc2626'
                            : allFinishedAndPaid
                              ? getGewerkBarColor('fertig', 'bezahlt')
                              : allFinished
                                ? getGewerkBarColor('fertig', 'offen')
                                : getGewerkBarColor('in Arbeit'),
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
