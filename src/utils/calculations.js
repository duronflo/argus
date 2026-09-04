// Financial calculations

export function sumAngebote(angebote) {
  return angebote.reduce((sum, a) => sum + (a.betragAngebot || 0), 0);
}

export function sumBeauftragt(angebote) {
  return angebote.reduce((sum, a) => sum + (a.betragBeauftragt || 0), 0);
}

export function sumBezahlt(angebote) {
  return angebote.reduce((sum, a) => sum + (a.bezahlt || 0), 0);
}

export function sumGewerkBezahlt(gewerk, angebote = []) {
  return angebote
    .filter((a) => a.gewerkId === gewerk.id)
    .reduce((sum, a) => sum + (a.bezahlt || 0), 0);
}

/**
 * Uses the paid amount as the effective planned amount once a trade has actual
 * costs. This releases the difference between the original estimate and the
 * amount that was actually paid back into the available budget.
 */
export function getEffektivesGewerkBudget(gewerk, angebote = []) {
  const geplant = gewerk.geplantBudget || 0;
  const bezahlt = sumGewerkBezahlt(gewerk, angebote);
  return bezahlt > 0 ? bezahlt : geplant;
}

export function sumGeplant(gewerke, angebote = []) {
  return gewerke.reduce((sum, g) => sum + getEffektivesGewerkBudget(g, angebote), 0);
}

export function sumOffen(angebote) {
  return sumBeauftragt(angebote) - sumBezahlt(angebote);
}

export function getAngeboteForGewerk(angebote, gewerkId) {
  return angebote.filter((a) => a.gewerkId === gewerkId);
}

export function getAusgewaehltesAngebot(angebote, gewerkId) {
  return angebote.find((a) => a.gewerkId === gewerkId && a.status === 'ausgewählt') || null;
}

export function calcEinheitGewerkStats(einheitId, gewerk, angebote) {
  const anteile = gewerk.einheitAnteile || {};
  const ids = gewerk.einheitIds || [];
  // Normalize the split so old or manually edited data still accounts for the
  // complete planned budget.
  const anteileSum = ids.reduce((s, id) => s + (anteile[id] || 0), 0);
  const anteil = anteileSum > 0
    ? (anteile[einheitId] || 0) / anteileSum
    : 1 / (ids.length || 1);
  const sumGeplant = getEffektivesGewerkBudget(gewerk, angebote) * anteil;
  const sumBezahlt = sumGewerkBezahlt(gewerk, angebote) * anteil;

  return {
    anteil,
    sumGeplant,
    sumBezahlt,
    sumOffen: Math.max(sumGeplant - sumBezahlt, 0),
  };
}

export function calcGesamtStats(angebote) {
  return {
    sumAngebote: sumAngebote(angebote),
    sumBeauftragt: sumBeauftragt(angebote),
    sumBezahlt: sumBezahlt(angebote),
    sumOffen: sumOffen(angebote),
  };
}

export function calcEinheitStats(einheit, gewerke, angebote) {
  const unitGewerke = gewerke.filter(
    (g) => g.einheitIds && g.einheitIds.includes(einheit.id)
  );
  let totalGeplant = 0;
  let totalBezahlt = 0;
  unitGewerke.forEach((g) => {
    const stats = calcEinheitGewerkStats(einheit.id, g, angebote);
    totalGeplant += stats.sumGeplant;
    totalBezahlt += stats.sumBezahlt;
  });
  return {
    sumGeplant: totalGeplant,
    sumBezahlt: totalBezahlt,
    sumOffen: totalGeplant - totalBezahlt,
  };
}

/**
 * Returns the effective project budget.
 * When units (Einheiten) with budgets exist, the project budget is derived as
 * the sum of all unit budgets. This makes it easier to manage budgets per unit.
 * Falls back to the manually entered projekt.budget when no unit budgets are set.
 */
export function calcProjectBudget(projekt, einheiten = []) {
  const unitBudgetSum = einheiten.reduce((s, e) => s + (e.budget || 0), 0);
  return unitBudgetSum > 0 ? unitBudgetSum : (projekt.budget || 0);
}

/**
 * Returns true if the project budget is derived from unit budgets.
 */
export function isProjectBudgetDerived(einheiten = []) {
  return einheiten.some((e) => (e.budget || 0) > 0);
}
