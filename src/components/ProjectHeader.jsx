import { formatCurrency } from '../utils/dateUtils';
import { calcEinheitStats, calcProjectBudget, sumGeplant } from '../utils/calculations';
import BudgetOverview from './BudgetOverview';

export default function ProjectHeader({ projekt, angebote, einheiten, gewerke, onEdit }) {
  const effectiveBudget = calcProjectBudget(projekt, einheiten);
  const geplant = sumGeplant(gewerke || []);

  return (
    <div className="project-header">
      <div className="project-header-info">
        <div>
          <h1 className="project-name">{projekt.name}</h1>
          {projekt.adresse && <p className="project-address">{projekt.adresse}</p>}
        </div>
        <button className="btn btn-ghost" onClick={onEdit}>✏ Bearbeiten</button>
      </div>
      {effectiveBudget > 0 && (
        <BudgetOverview budget={effectiveBudget} planned={geplant} paid={angebote.reduce((s, a) => s + (a.bezahlt || 0), 0)} />
      )}
      {einheiten && einheiten.length > 0 && (
        <div className="project-header-units">
          {einheiten.map((eh) => {
            const stats = calcEinheitStats(eh, gewerke || [], angebote);
            const pct = eh.budget > 0 ? Math.min((stats.sumGeplant / eh.budget) * 100, 100) : 0;
            const over = eh.budget > 0 && stats.sumGeplant > eh.budget;
            return (
              <div key={eh.id} className="project-header-unit">
                <div className="budget-bar-labels">
                  <span className="project-header-unit-name">{eh.name}</span>
                  <span style={{ color: over ? '#dc2626' : undefined, fontSize: 11 }}>
                    {formatCurrency(stats.sumGeplant)}{eh.budget > 0 && ` / ${formatCurrency(eh.budget)}`}
                    {over && ' ⚠'}
                  </span>
                </div>
                {eh.budget > 0 && (
                  <div className="budget-bar budget-bar--sm">
                    <div
                      className="budget-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: over ? '#dc2626' : pct > 80 ? '#d97706' : '#2563eb',
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
