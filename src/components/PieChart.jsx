import { formatCurrency } from '../utils/dateUtils';

/**
 * Donut chart (CSS conic-gradient, no charting library) with a legend.
 * The total sits in the legend's last row rather than inside the donut hole,
 * so long amounts never overflow the chart. Layout adapts to the width of the
 * surrounding container (container query), not to the screen width.
 */
export default function PieChart({ segments, size = 150, emptyText = 'Keine Daten vorhanden.' }) {
  const total = segments.reduce((s, seg) => s + (seg.value || 0), 0);

  if (total <= 0) {
    return <p className="empty-state">{emptyText}</p>;
  }

  const visible = segments.filter((seg) => (seg.value || 0) > 0);
  let cursor = 0;
  const stops = visible.map((seg) => {
    const start = (cursor / total) * 100;
    cursor += seg.value;
    return `${seg.color} ${start}% ${(cursor / total) * 100}%`;
  });

  return (
    <div className="pie-chart-wrap">
      <div className="pie-chart-layout">
        <div
          className="pie-chart"
          style={{ '--pie-size': `${size}px`, background: `conic-gradient(${stops.join(', ')})` }}
          aria-hidden="true"
        >
          <div className="pie-chart-hole" />
        </div>
        <ul className="pie-chart-legend">
          {visible.map((seg) => (
            <li key={seg.label} className="pie-chart-legend-item">
              <span className="pie-chart-legend-dot" style={{ background: seg.color }} />
              <span className="pie-chart-legend-label" title={seg.label}>{seg.label}</span>
              <span className="pie-chart-legend-value">{formatCurrency(seg.value)}</span>
              <span className="pie-chart-legend-pct">{Math.round((seg.value / total) * 100)} %</span>
            </li>
          ))}
          <li className="pie-chart-legend-item pie-chart-legend-total">
            <span />
            <span className="pie-chart-legend-label">Gesamt</span>
            <span className="pie-chart-legend-value">{formatCurrency(total)}</span>
            <span />
          </li>
        </ul>
      </div>
    </div>
  );
}
