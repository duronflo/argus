import { formatCurrency } from '../utils/dateUtils';
import { FINISHED_BAR_COLOR, PLANNED_BAR_COLOR, TOTAL_BUDGET_BAR_COLOR } from '../utils/colors';

export default function BudgetOverview({ budget = 0, planned = 0, paid = 0 }) {
  const max = Math.max(budget, planned, paid, 1);
  const bars = [
    { label: 'Gesamtbudget', value: budget, color: TOTAL_BUDGET_BAR_COLOR },
    { label: 'Geplant', value: planned, color: planned > budget && budget > 0 ? '#dc2626' : PLANNED_BAR_COLOR },
    { label: 'Bezahlt', value: paid, color: paid > budget && budget > 0 ? '#dc2626' : FINISHED_BAR_COLOR },
  ];

  return (
    <div className="budget-overview" aria-label="Budgetübersicht">
      {bars.map(({ label, value, color }) => (
        <div className="budget-overview-row" key={label}>
          <div className="budget-overview-label">
            <span>{label}</span>
            <span>{formatCurrency(value)}</span>
          </div>
          <div className="budget-bar">
            <div className="budget-bar-fill" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
