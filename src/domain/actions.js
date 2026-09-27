// Pure data updates. Every cascade (what happens to invoices when a trade,
// offer or unit is deleted) is defined here and nowhere else.

function withoutKey(obj, key) {
  const { [key]: _removed, ...rest } = obj || {};
  return rest;
}

/** Invoices may only point at units that are part of their trade. */
function cleanRechnungEinheiten(rechnungen, gewerk) {
  const ids = gewerk.einheitAnteile || {};
  return rechnungen.map((r) => (
    r.gewerkId === gewerk.id && r.einheitId && !(r.einheitId in ids) ? { ...r, einheitId: null } : r
  ));
}

export function saveItem(data, collection, item) {
  const list = data[collection] || [];
  const exists = list.some((x) => x.id === item.id);
  const next = {
    ...data,
    [collection]: exists ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item],
  };
  if (collection === 'gewerke') next.rechnungen = cleanRechnungEinheiten(next.rechnungen || [], item);
  return next;
}

export function removeItem(data, collection, id) {
  const next = { ...data, [collection]: (data[collection] || []).filter((x) => x.id !== id) };
  if (collection === 'gewerke') {
    next.angebote = next.angebote.filter((a) => a.gewerkId !== id);
    next.rechnungen = next.rechnungen.filter((r) => r.gewerkId !== id);
  }
  if (collection === 'angebote') {
    // Invoices stay – they were paid regardless of the offer being deleted.
    next.rechnungen = next.rechnungen.map((r) => (r.angebotId === id ? { ...r, angebotId: null } : r));
  }
  if (collection === 'einheiten') {
    next.gewerke = next.gewerke.map((g) => (
      id in (g.einheitAnteile || {}) ? { ...g, einheitAnteile: withoutKey(g.einheitAnteile, id) } : g
    ));
    next.rechnungen = next.rechnungen.map((r) => (r.einheitId === id ? { ...r, einheitId: null } : r));
  }
  return next;
}

export function reorderGewerke(data, idsInOrder) {
  const byId = new Map(data.gewerke.map((g) => [g.id, g]));
  const reordered = idsInOrder.map((id) => byId.get(id)).filter(Boolean);
  const missing = data.gewerke.filter((g) => !idsInOrder.includes(g.id));
  return { ...data, gewerke: [...reordered, ...missing] };
}
