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

export default function Badge({ status, small }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: small ? '2px 7px' : '3px 10px',
        borderRadius: 99,
        fontSize: small ? 11 : 12,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
}
