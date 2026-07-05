import { formatCurrency } from '../utils/dateUtils';

export default function ProjectHeader({ projekt, angebote, onEdit }) {
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
    </div>
  );
}
