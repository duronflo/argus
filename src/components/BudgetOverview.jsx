import { formatCurrency } from '../utils/dateUtils';

export default function BudgetOverview({ planned = 0, contracted = 0, paid = 0 }) {
  const max = Math.max(planned, contracted, paid, 1);
  const bars = [
    { label: 'Geplant', value: planned, color: '#64748b' },
    { label: 'Beauftragt', value: contracted, color: contracted > planned && planned > 0 ? '#dc2626' : '#2563eb' },
    { label: 'Bezahlt', value: paid, color: paid > planned && planned > 0 ? '#dc2626' : '#16a34a' },
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
