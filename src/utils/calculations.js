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

export function sumOffen(angebote) {
  return sumBeauftragt(angebote) - sumBezahlt(angebote);
}

export function getAngeboteForGewerk(angebote, gewerkId) {
  return angebote.filter((a) => a.gewerkId === gewerkId);
}

export function getAusgewaehltesAngebot(angebote, gewerkId) {
  return angebote.find((a) => a.gewerkId === gewerkId && a.status === 'ausgewählt') || null;
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
  let totalBeauftragt = 0;
  let totalBezahlt = 0;
  unitGewerke.forEach((g) => {
    const count = g.einheitIds.length || 1;
    const gwAngebote = angebote.filter((a) => a.gewerkId === g.id);
    totalBeauftragt += gwAngebote.reduce((s, a) => s + (a.betragBeauftragt || 0), 0) / count;
    totalBezahlt += gwAngebote.reduce((s, a) => s + (a.bezahlt || 0), 0) / count;
  });
  return {
    sumBeauftragt: totalBeauftragt,
    sumBezahlt: totalBezahlt,
    sumOffen: totalBeauftragt - totalBezahlt,
  };
}
