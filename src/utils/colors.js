// Deterministic color palette helpers – used to give categories (Gewerke,
// Einheiten, …) a stable, distinguishable color across the whole app without
// having to store a color value on the data itself.

const PALETTE = [
  '#2563eb', // blue
  '#d97706', // amber
  '#16a34a', // green
  '#dc2626', // red
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#db2777', // pink
  '#65a30d', // lime
  '#ea580c', // orange
  '#4f46e5', // indigo
  '#0d9488', // teal
  '#9333ea', // purple
];

export const PLANNED_BAR_COLOR = '#2563eb';
export const FINISHED_BAR_COLOR = '#16a34a';
export const FINISHED_UNPAID_BAR_COLOR = '#d97706';
export const TOTAL_BUDGET_BAR_COLOR = '#7c3aed';

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Returns a stable hex color for a given key (e.g. category or unit name). */
export function colorForKey(key) {
  if (!key) return PALETTE[0];
  return PALETTE[hashString(String(key)) % PALETTE.length];
}

/** Lightens a hex color by mixing it with white (amount 0–1). */
export function lighten(hex, amount = 0.85) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const [r, g, b] = [1, 2, 3].map((i) => parseInt(m[i], 16));
  const mix = (c) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export function getGewerkBarColor(status, paid = 0) {
  if (status !== 'fertig') return PLANNED_BAR_COLOR;
  return paid > 0 ? FINISHED_BAR_COLOR : FINISHED_UNPAID_BAR_COLOR;
}
