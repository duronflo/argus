export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined || amount === '') return '—';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function isOverdue(dateStr, status) {
  if (!dateStr || status === 'fertig') return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date(new Date().toDateString());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
