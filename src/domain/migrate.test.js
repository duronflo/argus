import { describe, expect, it } from 'vitest';
import { migrate, SCHEMA_VERSION } from './migrate';
import { buildModel } from './model';
import { sampleData } from '../data/sampleData';
import { sampleDataV1 } from './__fixtures__/sampleDataV1';

const projekt = { id: 'p', name: 'Test', password: '1234' };

describe('migrate', () => {
  it('keeps the numbers of the old sample data exactly as before', () => {
    // Expected values computed with the previous calculations.js on sampleDataV1.
    const model = buildModel(migrate(sampleDataV1));
    const byName = (name) => sampleDataV1.gewerke.find((g) => g.name === name).id;

    expect(model.gewerk(byName('Elektroinstallation'))).toMatchObject({ geplant: 8500, bezahlt: 4250 });
    expect(model.gewerk(byName('Sanitär / Bad EG'))).toMatchObject({ geplant: 12300, bezahlt: 6000 });
    expect(model.gewerk(byName('Dachsanierung'))).toMatchObject({ geplant: 22000, bezahlt: 22000, zahlstatus: 'bezahlt' });
    expect(model.gewerk(byName('Heizung / Wärmepumpe'))).toMatchObject({ geplant: 18500, bezahlt: 0 });
    expect(model.einheit('eh-1')).toMatchObject({ geplant: 27850, bezahlt: 8125 });
    expect(model.einheit('eh-2')).toMatchObject({ geplant: 4250, bezahlt: 2125 });
    expect(model.einheit('eh-3')).toMatchObject({ geplant: 18500, bezahlt: 0 });
    expect(model.projekt).toMatchObject({ geplant: 72600, bezahlt: 32250, budget: 120000 });
  });

  it('is idempotent', () => {
    const once = migrate(sampleDataV1);
    expect(migrate(structuredClone(once))).toEqual(once);
    expect(migrate(structuredClone(sampleData))).toEqual(migrate(sampleData));
  });

  it('turns the free "Bezahlt" amount of an offer into a paid invoice', () => {
    const data = migrate({
      projekt,
      gewerke: [{ id: 'g1', name: 'Elektro' }],
      angebote: [{ id: 'a1', gewerkId: 'g1', anbieter: 'Müller', betragAngebot: 1000, bezahlt: 400, betragBeauftragt: 1000 }],
    });
    expect(data.schemaVersion).toBe(SCHEMA_VERSION);
    expect(data.angebote[0]).not.toHaveProperty('bezahlt');
    expect(data.angebote[0]).not.toHaveProperty('betragBeauftragt');
    expect(data.rechnungen).toEqual([expect.objectContaining({
      gewerkId: 'g1', angebotId: 'a1', anbieter: 'Müller', betrag: 400, bezahlt: true,
    })]);
  });

  it('moves invoices nested in an offer to the invoice list, ignoring the old Bezahlt field', () => {
    const data = migrate({
      projekt,
      gewerke: [{ id: 'g1', name: 'Elektro' }],
      angebote: [{
        id: 'a1', gewerkId: 'g1', anbieter: 'Müller', bezahlt: 999,
        rechnungen: [
          { id: 'r1', titel: 'Abschlag', betrag: '300', status: 'bezahlt' },
          { id: 'r2', titel: 'Schluss', betrag: 700, status: 'offen' },
        ],
      }],
    });
    expect(data.angebote[0]).not.toHaveProperty('rechnungen');
    expect(data.rechnungen.map((r) => [r.id, r.angebotId, r.betrag, r.bezahlt]))
      .toEqual([['r1', 'a1', 300, true], ['r2', 'a1', 700, false]]);
  });

  it('turns a paid marker without amount into an invoice over the offer amount', () => {
    const data = migrate({
      projekt,
      gewerke: [{ id: 'g1', name: 'Elektro' }],
      angebote: [{ id: 'a1', gewerkId: 'g1', anbieter: 'Müller', betragAngebot: 1200, bezahltMarkiert: true }],
    });
    expect(data.rechnungen).toEqual([expect.objectContaining({ betrag: 1200, bezahlt: true })]);
  });

  it('converts einheitIds to einheitAnteile and drops unknown units', () => {
    const data = migrate({
      projekt,
      einheiten: [{ id: 'e1', name: 'EG' }, { id: 'e2', name: 'OG' }],
      gewerke: [
        { id: 'g1', einheitIds: ['e1', 'e2'], einheitAnteile: { e1: 70, e2: 30 } },
        { id: 'g2', einheitIds: ['e1', 'e2', 'weg'] },
        { id: 'g3', einheitIds: ['e1'], einheitAnteile: { e1: 100, e2: 50 } },
      ],
      angebote: [],
    });
    expect(data.gewerke.map((g) => g.einheitAnteile)).toEqual([
      { e1: 70, e2: 30 },
      { e1: 50, e2: 50 },
      { e1: 100 },
    ]);
    expect(data.gewerke[0]).not.toHaveProperty('einheitIds');
  });

  it('converts the invoice status to a boolean and clears dangling references', () => {
    const data = migrate({
      projekt,
      einheiten: [{ id: 'e1' }, { id: 'e2' }],
      gewerke: [{ id: 'g1', einheitAnteile: { e1: 100 } }],
      angebote: [],
      rechnungen: [
        { id: 'r1', gewerkId: 'g1', betrag: 10, status: 'bezahlt', einheitId: 'e1', angebotId: 'weg' },
        { id: 'r2', gewerkId: 'g1', betrag: 10, status: 'offen', einheitId: 'e2' },
        { id: 'r3', gewerkId: '', betrag: 10 },
      ],
    });
    expect(data.rechnungen.map((r) => [r.id, r.bezahlt, r.einheitId, r.angebotId]))
      .toEqual([['r1', true, 'e1', null], ['r2', false, null, null]]);
    expect(data.rechnungen[0]).not.toHaveProperty('status');
  });

  it('keeps the existing password rule (empty → 0000)', () => {
    expect(migrate({ projekt: { name: 'x' }, gewerke: [], angebote: [] }).projekt.password).toBe('0000');
    expect(migrate({ projekt, gewerke: [], angebote: [] }).projekt.password).toBe('1234');
  });
});
