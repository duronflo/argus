import { formatCurrency } from '../utils/dateUtils';

/**
 * Simple donut chart (built with a CSS conic-gradient, no charting library
 * needed) that visualizes how a total value is distributed across a set of
 * segments, plus a legend with the exact values/percentages.
 */
export default function PieChart({ segments, size = 150, emptyText = 'Keine Daten vorhanden.' }) {
  const total = segments.reduce((s, seg) => s + (seg.value || 0), 0);

  if (total <= 0) {
    return <p className="empty-state">{emptyText}</p>;
  }

  let cursor = 0;
  const stops = segments
    .filter((seg) => (seg.value || 0) > 0)
    .map((seg) => {
      const start = (cursor / total) * 100;
      cursor += seg.value;
      const end = (cursor / total) * 100;
      return `${seg.color} ${start}% ${end}%`;
    });

  return (
    <div className="pie-chart-wrap">
      <div
        className="pie-chart"
        style={{ width: size, height: size, background: `conic-gradient(${stops.join(', ')})` }}
      >
        <div className="pie-chart-hole">
          <span className="pie-chart-total">{formatCurrency(total)}</span>
          <span className="pie-chart-total-label">Gesamt</span>
        </div>
      </div>
      <ul className="pie-chart-legend">
        {segments.filter((seg) => (seg.value || 0) > 0).map((seg) => (
          <li key={seg.label} className="pie-chart-legend-item">
            <span className="pie-chart-legend-dot" style={{ background: seg.color }} />
            <span className="pie-chart-legend-label">{seg.label}</span>
            <span className="pie-chart-legend-value">
              {formatCurrency(seg.value)} <span className="pie-chart-legend-pct">({Math.round((seg.value / total) * 100)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
