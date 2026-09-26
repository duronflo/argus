import { describe, expect, it } from 'vitest';
import { buildModel } from './model';
import { removeItem, saveItem } from './actions';

function project({ status = 'in Arbeit', rechnungen = [] } = {}) {
  return {
    projekt: { budget: 0 },
    einheiten: [{ id: 'eg', budget: 10000 }, { id: 'og', budget: 5000 }],
    gewerke: [{ id: 'elektro', status, geplantBudget: 8000, einheitAnteile: { eg: 50, og: 50 } }],
    angebote: [{ id: 'a1', gewerkId: 'elektro', betragAngebot: 7500, status: 'ausgewählt' }],
    rechnungen,
  };
}

const rechnung = (id, betrag, bezahlt, extra = {}) => ({ id, gewerkId: 'elektro', betrag, bezahlt, einheitId: null, angebotId: null, ...extra });

describe('buildModel', () => {
  it('uses the budget while the trade is not finished', () => {
    const model = buildModel(project({ rechnungen: [rechnung('r1', 3000, true), rechnung('r2', 1000, false)] }));
    expect(model.gewerk('elektro')).toMatchObject({ geplant: 8000, bezahlt: 3000, offen: 5000, summeRechnungen: 4000, zahlstatus: null });
  });

  it('uses all invoices (paid and open) once the trade is finished', () => {
    const model = buildModel(project({ status: 'fertig', rechnungen: [rechnung('r1', 3000, true), rechnung('r2', 1000, false)] }));
    expect(model.gewerk('elektro')).toMatchObject({ geplant: 4000, bezahlt: 3000, offen: 1000, abgerechnet: true, zahlstatus: 'offen' });
  });

  it('marks a finished trade as paid only when every invoice is paid', () => {
    const paid = buildModel(project({ status: 'fertig', rechnungen: [rechnung('r1', 3000, true)] }));
    expect(paid.gewerk('elektro').zahlstatus).toBe('bezahlt');
    const none = buildModel(project({ status: 'fertig' }));
    expect(none.gewerk('elektro')).toMatchObject({ zahlstatus: 'offen', geplant: 8000 });
  });

  it('splits the budget and unassigned invoices by the trade shares', () => {
    const model = buildModel(project({ rechnungen: [rechnung('r1', 1000, true)] }));
    expect(model.einheit('eg')).toMatchObject({ geplant: 4000, bezahlt: 500 });
    expect(model.einheit('og')).toMatchObject({ geplant: 4000, bezahlt: 500 });
  });

  it('books an invoice with a unit completely on that unit', () => {
    const model = buildModel(project({ rechnungen: [rechnung('r1', 980, true, { einheitId: 'og' })] }));
    expect(model.einheit('eg')).toMatchObject({ bezahlt: 0 });
    expect(model.einheit('og')).toMatchObject({ bezahlt: 980 });
  });

  it('keeps unit totals equal to the trade total for finished trades', () => {
    const model = buildModel(project({
      status: 'fertig',
      rechnungen: [rechnung('r1', 3000, true), rechnung('r2', 980, false, { einheitId: 'og' })],
    }));
    expect(model.einheit('eg').geplant).toBe(1500);
    expect(model.einheit('og').geplant).toBe(2480);
    expect(model.einheit('eg').geplant + model.einheit('og').geplant).toBe(model.gewerk('elektro').geplant);
  });

  it('computes project and offer totals', () => {
    const model = buildModel(project({ rechnungen: [rechnung('r1', 1000, true, { angebotId: 'a1' }), rechnung('r2', 500, false)] }));
    expect(model.projekt).toMatchObject({ budget: 15000, budgetAusEinheiten: true, geplant: 8000, bezahlt: 1000, summeAusgewaehlt: 7500 });
    expect(model.angebot('a1')).toEqual({ summeRechnungen: 1000, bezahlt: 1000, anzahlRechnungen: 1 });
  });

  it('returns empty stats for unknown ids instead of crashing', () => {
    const model = buildModel(project());
    expect(model.gewerk('nope').geplant).toBe(0);
    expect(model.einheit('nope').gewerke).toEqual([]);
  });
});

describe('actions', () => {
  it('deleting a trade deletes its offers and invoices', () => {
    const next = removeItem(project({ rechnungen: [rechnung('r1', 1, true)] }), 'gewerke', 'elektro');
    expect(next.angebote).toEqual([]);
    expect(next.rechnungen).toEqual([]);
  });

  it('deleting an offer keeps its invoices', () => {
    const next = removeItem(project({ rechnungen: [rechnung('r1', 1, true, { angebotId: 'a1' })] }), 'angebote', 'a1');
    expect(next.rechnungen).toEqual([expect.objectContaining({ id: 'r1', angebotId: null })]);
  });

  it('deleting a unit removes it from shares and invoices', () => {
    const next = removeItem(project({ rechnungen: [rechnung('r1', 1, true, { einheitId: 'og' })] }), 'einheiten', 'og');
    expect(next.gewerke[0].einheitAnteile).toEqual({ eg: 50 });
    expect(next.rechnungen[0].einheitId).toBeNull();
  });

  it('removing a unit from a trade un-assigns its invoices', () => {
    const data = project({ rechnungen: [rechnung('r1', 1, true, { einheitId: 'og' })] });
    const next = saveItem(data, 'gewerke', { ...data.gewerke[0], einheitAnteile: { eg: 100 } });
    expect(next.rechnungen[0].einheitId).toBeNull();
  });

  it('saveItem appends new and replaces existing items', () => {
    const data = project();
    const added = saveItem(data, 'rechnungen', rechnung('r9', 5, false));
    expect(added.rechnungen).toHaveLength(1);
    const replaced = saveItem(added, 'rechnungen', rechnung('r9', 6, true));
    expect(replaced.rechnungen).toEqual([expect.objectContaining({ id: 'r9', betrag: 6, bezahlt: true })]);
  });
});
