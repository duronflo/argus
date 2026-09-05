const STATUS_CONFIG = {
  // Gewerk status
  offen: { label: 'Offen', color: '#6b7280', bg: '#f3f4f6' },
  angefragt: { label: 'Angefragt', color: '#2563eb', bg: '#dbeafe' },
  angeboten: { label: 'Angeboten', color: '#d97706', bg: '#fef3c7' },
  beauftragt: { label: 'Beauftragt', color: '#7c3aed', bg: '#ede9fe' },
  'in Arbeit': { label: 'In Arbeit', color: '#0891b2', bg: '#cffafe' },
  fertig: { label: 'Fertig', color: '#16a34a', bg: '#dcfce7' },
  // Angebot status
  ausgewählt: { label: 'Ausgewählt', color: '#16a34a', bg: '#dcfce7' },
  abgelehnt: { label: 'Abgelehnt', color: '#dc2626', bg: '#fee2e2' },
  // Meilenstein status
  erledigt: { label: 'Erledigt', color: '#16a34a', bg: '#dcfce7' },
};

export function GewerkPaymentBadge({ status, paid = 0, small }) {
  if (status !== 'fertig') return null;
  const isPaid = paid > 0;
  const color = isPaid ? '#16a34a' : '#d97706';
  return (
    <span
      className="status-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: small ? '2px 7px' : '3px 10px',
        borderRadius: 99,
        border: `1px solid ${color}`,
        fontSize: small ? 11 : 12,
        fontWeight: 600,
        color,
        background: isPaid ? '#dcfce7' : '#fef3c7',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
        flexShrink: 0,
      }}
    >
      <span className="status-badge-dot" style={{ background: color }} aria-hidden="true" />
      {isPaid ? 'Bezahlt' : 'Zahlung offen'}
    </span>
  );
}

export default function Badge({ status, small }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span
      className="status-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: small ? '2px 7px' : '3px 10px',
        borderRadius: 99,
        border: `1px solid ${cfg.color}`,
        fontSize: small ? 11 : 12,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
        flexShrink: 0,
      }}
    >
      <span className="status-badge-dot" style={{ background: cfg.color }} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}
