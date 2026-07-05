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
