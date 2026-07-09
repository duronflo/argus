import { formatCurrency } from '../utils/dateUtils';
import { calcEinheitStats } from '../utils/calculations';

export default function ProjectHeader({ projekt, angebote, einheiten, gewerke, onEdit }) {
  const beauftragt = angebote.reduce((s, a) => s + (a.betragBeauftragt || 0), 0);
  const budgetPct = projekt.budget > 0 ? Math.min((beauftragt / projekt.budget) * 100, 100) : 0;
  const budgetOver = beauftragt > projekt.budget;

  return (
    <div className="project-header">
      <div className="project-header-info">
        <div>
          <h1 className="project-name">{projekt.name}</h1>
          {projekt.adresse && <p className="project-address">{projekt.adresse}</p>}
        </div>
        <button className="btn btn-ghost" onClick={onEdit}>✏ Bearbeiten</button>
      </div>
      {projekt.budget > 0 && (
        <div className="budget-bar-wrap">
          <div className="budget-bar-labels">
            <span>Beauftragt: {formatCurrency(beauftragt)}</span>
            <span style={{ color: budgetOver ? '#dc2626' : undefined }}>
              Budget: {formatCurrency(projekt.budget)}
              {budgetOver && ' ⚠ Überschritten!'}
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
      {einheiten && einheiten.length > 0 && (
        <div className="project-header-units">
          {einheiten.map((eh) => {
            const stats = calcEinheitStats(eh, gewerke || [], angebote);
            const pct = eh.budget > 0 ? Math.min((stats.sumBeauftragt / eh.budget) * 100, 100) : 0;
            const over = eh.budget > 0 && stats.sumBeauftragt > eh.budget;
            return (
              <div key={eh.id} className="project-header-unit">
                <div className="budget-bar-labels">
                  <span className="project-header-unit-name">{eh.name}</span>
                  <span style={{ color: over ? '#dc2626' : undefined, fontSize: 11 }}>
                    {formatCurrency(stats.sumBeauftragt)}{eh.budget > 0 && ` / ${formatCurrency(eh.budget)}`}
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
