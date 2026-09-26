// All money calculations live here. buildModel() runs once per data change;
// views only read the precomputed numbers.
//
// Regeln:
// - Bezahlt   = Summe der bezahlten Rechnungen.
// - Geplant   = Budget des Gewerks. Bei fertigen Gewerken mit Rechnungen
//               zählt stattdessen die Rechnungssumme (bezahlt + offen).
// - Offen     = Geplant − Bezahlt (nie negativ).
// - Einheiten = Budget nach Verteilungsschlüssel des Gewerks. Eine Rechnung
//               mit Einheit zählt zu 100 % dieser Einheit, eine ohne Einheit
//               wird nach dem Schlüssel verteilt.

export function getEinheitIds(gewerk) {
  return Object.keys(gewerk?.einheitAnteile || {});
}

/** Shares as fractions that always add up to 1 (equal split if all are 0). */
export function getAnteile(gewerk) {
  const ids = getEinheitIds(gewerk);
  const raw = gewerk.einheitAnteile || {};
  const total = ids.reduce((s, id) => s + (raw[id] || 0), 0);
  return Object.fromEntries(
    ids.map((id) => [id, total > 0 ? (raw[id] || 0) / total : 1 / ids.length]),
  );
}

function verteile(rechnung, anteile) {
  if (rechnung.einheitId && rechnung.einheitId in anteile) {
    return [[rechnung.einheitId, rechnung.betrag]];
  }
  return Object.entries(anteile).map(([id, anteil]) => [id, rechnung.betrag * anteil]);
}

function groupBy(items, key) {
  const map = new Map();
  items.forEach((item) => {
    const k = item[key];
    if (!k) return;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
  });
  return map;
}

const sum = (items, fn) => items.reduce((s, item) => s + (fn(item) || 0), 0);
const offen = (geplant, bezahlt) => Math.max(geplant - bezahlt, 0);

const EMPTY_GEWERK = Object.freeze({
  budget: 0, geplant: 0, bezahlt: 0, offen: 0, summeRechnungen: 0,
  abgerechnet: false, zahlstatus: null, anzahlAngebote: 0, anzahlRechnungen: 0,
  einheitIds: [], proEinheit: {},
});
const EMPTY_EINHEIT = Object.freeze({ budget: 0, geplant: 0, bezahlt: 0, offen: 0, gewerke: [] });
const EMPTY_ANGEBOT = Object.freeze({ summeRechnungen: 0, bezahlt: 0, anzahlRechnungen: 0 });

export function buildModel(data) {
  const { projekt = {}, einheiten = [], gewerke = [], angebote = [], rechnungen = [] } = data || {};
  const rechnungenByGewerk = groupBy(rechnungen, 'gewerkId');
  const rechnungenByAngebot = groupBy(rechnungen, 'angebotId');
  const angeboteByGewerk = groupBy(angebote, 'gewerkId');

  const einheitStats = new Map(einheiten.map((e) => [
    e.id,
    { budget: e.budget || 0, geplant: 0, bezahlt: 0, offen: 0, gewerke: [] },
  ]));

  const gewerkStats = new Map();
  gewerke.forEach((g) => {
    const rs = rechnungenByGewerk.get(g.id) || [];
    const summeRechnungen = sum(rs, (r) => r.betrag);
    const bezahlt = sum(rs, (r) => (r.bezahlt ? r.betrag : 0));
    const abgerechnet = g.status === 'fertig' && summeRechnungen > 0;
    const geplant = abgerechnet ? summeRechnungen : (g.geplantBudget || 0);
    const anteile = getAnteile(g);

    const proEinheit = {};
    Object.entries(anteile).forEach(([id, anteil]) => {
      proEinheit[id] = { anteil, geplant: abgerechnet ? 0 : geplant * anteil, bezahlt: 0 };
    });
    rs.forEach((r) => {
      verteile(r, anteile).forEach(([id, betrag]) => {
        if (abgerechnet) proEinheit[id].geplant += betrag;
        if (r.bezahlt) proEinheit[id].bezahlt += betrag;
      });
    });
    Object.values(proEinheit).forEach((s) => { s.offen = offen(s.geplant, s.bezahlt); });

    gewerkStats.set(g.id, {
      budget: g.geplantBudget || 0,
      geplant,
      bezahlt,
      offen: offen(geplant, bezahlt),
      summeRechnungen,
      abgerechnet,
      // Only meaningful once the trade is finished: all invoices paid or not.
      zahlstatus: g.status !== 'fertig' ? null : (rs.length > 0 && rs.every((r) => r.bezahlt) ? 'bezahlt' : 'offen'),
      anzahlAngebote: (angeboteByGewerk.get(g.id) || []).length,
      anzahlRechnungen: rs.length,
      einheitIds: Object.keys(anteile),
      proEinheit,
    });

    Object.entries(proEinheit).forEach(([id, s]) => {
      const e = einheitStats.get(id);
      if (!e) return;
      e.geplant += s.geplant;
      e.bezahlt += s.bezahlt;
      e.gewerke.push({ gewerkId: g.id, ...s });
    });
  });
  einheitStats.forEach((e) => { e.offen = offen(e.geplant, e.bezahlt); });

  const angebotStats = new Map(angebote.map((a) => {
    const rs = rechnungenByAngebot.get(a.id) || [];
    return [a.id, {
      summeRechnungen: sum(rs, (r) => r.betrag),
      bezahlt: sum(rs, (r) => (r.bezahlt ? r.betrag : 0)),
      anzahlRechnungen: rs.length,
    }];
  }));

  const einheitenBudget = sum(einheiten, (e) => e.budget);
  const geplant = sum([...gewerkStats.values()], (s) => s.geplant);
  const bezahlt = sum(rechnungen, (r) => (r.bezahlt ? r.betrag : 0));
  const gewerkeNachStatus = {};
  gewerke.forEach((g) => { gewerkeNachStatus[g.status] = (gewerkeNachStatus[g.status] || 0) + 1; });

  return {
    gewerk: (id) => gewerkStats.get(id) || EMPTY_GEWERK,
    einheit: (id) => einheitStats.get(id) || EMPTY_EINHEIT,
    angebot: (id) => angebotStats.get(id) || EMPTY_ANGEBOT,
    projekt: {
      budget: einheitenBudget > 0 ? einheitenBudget : (projekt.budget || 0),
      budgetAusEinheiten: einheitenBudget > 0,
      geplant,
      bezahlt,
      offen: offen(geplant, bezahlt),
      summeAngebote: sum(angebote, (a) => a.betragAngebot),
      summeAusgewaehlt: sum(angebote, (a) => (a.status === 'ausgewählt' ? a.betragAngebot : 0)),
      offeneAngebote: angebote.filter((a) => a.status === 'offen').length,
      summeRechnungen: sum(rechnungen, (r) => r.betrag),
      gewerkeNachStatus,
    },
  };
}
