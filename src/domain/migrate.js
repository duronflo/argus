// Brings any stored or imported project (old or current format) into the
// current data model. Pure function – safe to run on every load and import.
//
// Datenmodell v2:
//   gewerk:   { id, name, kategorie, status, geplantBudget, einheitAnteile: { einheitId: % }, notizen }
//   angebot:  { id, gewerkId, anbieter, titel, betragAngebot, status, notiz }
//   rechnung: { id, gewerkId, angebotId|null, einheitId|null, anbieter, titel, betrag, bezahlt: boolean, notiz }
//
// v1 kannte drei Wege, eine Zahlung zu erfassen (Bezahlt-Feld am Angebot,
// Rechnungen im Angebot, direkte Rechnungen). v2 kennt nur noch die
// Rechnungsliste; alles andere wird hier in Rechnungen umgewandelt.

import { DEFAULT_KATEGORIEN } from '../data/sampleData';

export const SCHEMA_VERSION = 2;

const ANGEBOT_STATUSES = ['offen', 'ausgewählt', 'abgelehnt'];

const num = (value) => parseFloat(value) || 0;

// Fields dropped from the data model; old projects lose them on load.
const REMOVED_GEWERK_FIELDS = ['einheitIds', 'geplanterStart', 'geplantesEnde', 'tatsaechlicherStart', 'tatsaechlichesEnde'];
const REMOVED_ANGEBOT_FIELDS = ['bezahlt', 'bezahltMarkiert', 'betragBeauftragt', 'rechnungen', 'datum', 'gueltigBis'];
const REMOVED_RECHNUNG_FIELDS = ['status', 'bezahltMarkiert'];

function omit(obj, keys) {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key)));
}
const text = (value) => (typeof value === 'string' ? value : '');

export function equalSplit(ids) {
  const pct = ids.length > 0 ? Math.round(100 / ids.length) : 0;
  return Object.fromEntries(
    ids.map((id, i) => [id, i === ids.length - 1 ? 100 - pct * (ids.length - 1) : pct]),
  );
}

function isPaid(rechnung) {
  return rechnung?.bezahlt === true
    || rechnung?.status === 'bezahlt'
    || !!rechnung?.bezahltMarkiert
    || num(rechnung?.bezahlt) > 0;
}

function migrateEinheit(einheit) {
  return { ...einheit, name: text(einheit.name), budget: num(einheit.budget), notizen: text(einheit.notizen) };
}

function migrateGewerk(gewerk, einheitIds) {
  const oldIds = gewerk.einheitIds;
  const oldAnteile = gewerk.einheitAnteile || {};
  const ids = (Array.isArray(oldIds) ? oldIds : Object.keys(oldAnteile))
    .filter((id) => einheitIds.has(id));
  const hasShares = ids.some((id) => num(oldAnteile[id]) > 0);
  return {
    ...omit(gewerk, REMOVED_GEWERK_FIELDS),
    name: text(gewerk.name),
    kategorie: gewerk.kategorie || 'Sonstiges',
    status: gewerk.status || 'offen',
    geplantBudget: num(gewerk.geplantBudget),
    notizen: text(gewerk.notizen),
    einheitAnteile: hasShares
      ? Object.fromEntries(ids.map((id) => [id, num(oldAnteile[id])]))
      : equalSplit(ids),
  };
}

function migrateRechnung(rechnung) {
  return {
    ...omit(rechnung, REMOVED_RECHNUNG_FIELDS),
    gewerkId: rechnung.gewerkId || '',
    angebotId: rechnung.angebotId || null,
    einheitId: rechnung.einheitId || null,
    anbieter: text(rechnung.anbieter),
    titel: text(rechnung.titel),
    betrag: num(rechnung.betrag),
    bezahlt: isPaid(rechnung),
    notiz: text(rechnung.notiz),
  };
}

/** Splits a v1 offer into a v2 offer plus the invoices it used to carry. */
function migrateAngebot(angebot) {
  const { bezahlt, bezahltMarkiert, rechnungen } = angebot;
  const migrated = {
    ...omit(angebot, REMOVED_ANGEBOT_FIELDS),
    anbieter: text(angebot.anbieter),
    titel: text(angebot.titel),
    betragAngebot: num(angebot.betragAngebot),
    status: ANGEBOT_STATUSES.includes(angebot.status) ? angebot.status : 'offen',
    notiz: text(angebot.notiz),
  };

  const base = { gewerkId: angebot.gewerkId, angebotId: angebot.id, anbieter: migrated.anbieter };
  let derived = [];
  if (Array.isArray(rechnungen) && rechnungen.length > 0) {
    // Rechnungen im Angebot: ersetzen (wie bisher) das Bezahlt-Feld des Angebots.
    derived = rechnungen.map((r, i) => migrateRechnung({
      ...r,
      ...base,
      id: r.id || `${angebot.id}-rg-${i + 1}`,
    }));
  } else if (num(bezahlt) > 0) {
    derived = [migrateRechnung({
      ...base,
      id: `${angebot.id}-zahlung`,
      titel: 'Zahlung (übernommen)',
      betrag: num(bezahlt),
      bezahlt: true,
    })];
  } else if (bezahltMarkiert) {
    derived = [migrateRechnung({
      ...base,
      id: `${angebot.id}-zahlung`,
      titel: 'Als bezahlt markiert (übernommen – Betrag prüfen)',
      betrag: migrated.betragAngebot,
      bezahlt: true,
    })];
  }
  return { angebot: migrated, rechnungen: derived };
}

export function migrate(input) {
  if (!input || !input.projekt) return input;

  const einheiten = (input.einheiten || []).map(migrateEinheit);
  const einheitIds = new Set(einheiten.map((e) => e.id));
  const gewerke = (input.gewerke || []).map((g) => migrateGewerk(g, einheitIds));

  const angebote = [];
  const angebotRechnungen = [];
  (input.angebote || []).forEach((a) => {
    const result = migrateAngebot(a);
    angebote.push(result.angebot);
    angebotRechnungen.push(...result.rechnungen);
  });
  const angebotIds = new Set(angebote.map((a) => a.id));
  const anteileByGewerk = new Map(gewerke.map((g) => [g.id, g.einheitAnteile]));

  const rechnungen = [...(input.rechnungen || []).map(migrateRechnung), ...angebotRechnungen]
    .filter((r) => r.gewerkId)
    .map((r) => ({
      ...r,
      angebotId: angebotIds.has(r.angebotId) ? r.angebotId : null,
      einheitId: r.einheitId && r.einheitId in (anteileByGewerk.get(r.gewerkId) || {}) ? r.einheitId : null,
    }));

  return {
    schemaVersion: SCHEMA_VERSION,
    projekt: { ...input.projekt, password: input.projekt.password || '0000' },
    kategorien: input.kategorien?.length ? input.kategorien : [...DEFAULT_KATEGORIEN],
    einheiten,
    gewerke,
    angebote,
    rechnungen,
  };
}
