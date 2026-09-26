// Status values, in workflow order (also used for sorting).

// "angefragt"/"angeboten" were dropped in v2: whether offers exist is visible
// from the offers themselves, so a trade is simply "offen" until it is commissioned.
export const GEWERK_STATUSES = ['offen', 'beauftragt', 'in Arbeit', 'fertig'];

export const ANGEBOT_STATUSES = ['offen', 'ausgewählt', 'abgelehnt'];

export const statusLabel = (status) => status.charAt(0).toUpperCase() + status.slice(1);
