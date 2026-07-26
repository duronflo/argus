export const DEFAULT_KATEGORIEN = [
  'Elektro', 'Sanitär', 'Maler', 'Boden', 'Dach', 'Heizung',
  'Fenster', 'Maurer', 'Zimmerer', 'Dachdecker', 'Küche', 'Schreiner',
  'Fassade', 'Sonstiges',
];

const KOSTENSCHAETZUNG = [
  {
    einheitId: 'eh-1',
    prefix: 'WE 1',
    items: [
      ['Erneuerung Außentüren und Fenster', 'Fenster', 16600],
      ['Anbau neuer Eingangsbereich', 'Maurer', 9100],
      ['Einbau neue Küche inkl. Durchbruch', 'Küche', 16000],
      ['Renovierung Bodenbeläge gesamte Wohnung inkl. Bäder', 'Boden', 12820],
      ['Erneuerung Innentüren', 'Schreiner', 4200],
      ['Überarbeiten Fassade', 'Fassade', 600],
      ['Trockenbauarbeiten (Innenwand neu)', 'Maurer', 600],
      ['Sanitärarbeiten neues Bad', 'Sanitär', 15000],
      ['Elektroarbeiten', 'Elektro', 2000],
      ['Erneuerung Heizsystem (Pelletofen)', 'Heizung', 8750],
      ['Sanierung Wasserleitungen (Bestand: Kupfer)', 'Sanitär', 5000],
    ],
  },
  {
    einheitId: 'eh-2',
    prefix: 'WE 2',
    items: [
      ['Erneuerung Außentüren und Fenster', 'Fenster', 45220],
      ['Renovierung Bodenbeläge gesamte Wohnung inkl. Bäder', 'Boden', 14250],
      ['Einbau neue Küche inkl. Durchbruch', 'Küche', 36000],
      ['Erneuerung Unterdecken EG (Abbruch, Decke, Anstrich)', 'Maler', 6250],
      ['Erneuerung Innentüren', 'Schreiner', 7000],
      ['Überarbeiten Fassade', 'Fassade', 1350],
      ['Erneuerung Elektroinstallation (KNX, …)', 'Elektro', 13290],
      ['Erneuerung Heizsystem (Pelletofen)', 'Heizung', 19250],
      ['Sanitärarbeiten neue Bäder (EG/OG)', 'Sanitär', 25000],
      ['Sanierung Wasserleitungen (Bestand: Kupfer)', 'Sanitär', 13250],
    ],
  },
  {
    einheitId: 'eh-3',
    prefix: 'Praxis',
    items: [
      ['Erneuerung Außentüren und Fenster', 'Fenster', 21460],
      ['Anbau neuer Eingangsbereich für WE 01', 'Maurer', 33900],
      ['Überarbeiten Fassade', 'Fassade', 1050],
      ['Trockenbauarbeiten (Innenwand neu)', 'Maurer', 2400],
      ['Anpassung Bodenbeläge Labor / Behandlung 01', 'Boden', 3000],
      ['Einbauschrank Praxis', 'Schreiner', 5000],
      ['Erneuerung Heizsystem (Pelletofen)', 'Heizung', 7300],
      ['Sanierung Wasserleitungen (Bestand: Kupfer)', 'Sanitär', 6750],
      ['Elektroinstallation (Schalter, Steckdosen, Lampen, …)', 'Elektro', 1500],
      ['Rückbau Balkon/Dach inkl. Anpassung/Reparatur', 'Dach', 13000],
    ],
  },
];

const gewerke = KOSTENSCHAETZUNG.flatMap(({ einheitId, prefix, items }, groupIndex) =>
  items.map(([name, kategorie, budget], itemIndex) => ({
    id: `gw-${groupIndex + 1}-${itemIndex + 1}`,
    name: `${prefix}: ${name}`,
    kategorie,
    status: 'offen',
    budget,
    notizen: 'Kostenschätzung brutto, aufgestellt am 21.05.2026. Noch kein Angebot vorhanden.',
    geplanterStart: '',
    geplantesEnde: '',
    tatsaechlicherStart: '',
    tatsaechlichesEnde: '',
    einheitIds: [einheitId],
    einheitAnteile: { [einheitId]: 100 },
  }))
);

export const sampleData = {
  projekt: {
    id: 'proj-edesheim',
    name: 'Umbau Wohnhaus mit Arztpraxis',
    adresse: 'Am Rosengarten 2, 67483 Edesheim',
    budget: 366890,
    notizen: 'Kostenschätzung auf Basis der Entwurfsplanung, aufgestellt in Edesheim am 21.05.2026. Vakanzannahme: 20–25 %.',
    password: '0000',
  },
  kategorien: [...DEFAULT_KATEGORIEN],
  einheiten: [
    { id: 'eh-1', name: 'WE 1 (Einliegerwohnung)', budget: 90670, notizen: 'Neue Wohneinheit im Obergeschoss mit separatem Eingang.' },
    { id: 'eh-2', name: 'WE 2 (Wohnhaus)', budget: 180860, notizen: 'Bestehende Wohneinheit.' },
    { id: 'eh-3', name: 'Praxis', budget: 95360, notizen: 'Praxisbereich Labor und Behandlung 01.' },
  ],
  gewerke,
  angebote: [],
  meilensteine: [],
};
