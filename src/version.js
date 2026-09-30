// Versionshistorie – neueste Version oben. Bei jedem Release hier einen
// Eintrag ergänzen und "version" in package.json angleichen (ein Test prüft das).
// Solange die App noch nicht fertig ist, bleibt die Hauptversion 0: neue
// Funktionen erhöhen die zweite Stelle (0.3.0), kleine Korrekturen die dritte.

export const CHANGELOG = [
  {
    version: '0.2.1',
    datum: '2026-09-30',
    titel: 'Angebot ersetzt Planung',
    punkte: [
      'Liegt für ein Gewerk ein Angebot vor, ersetzt dessen Betrag das geplante Budget – ausgewählte Angebote vor offenen, abgelehnte zählen nicht.',
      'Gewerk-Liste und Gewerk-Fenster zeigen, ob „Geplant“ aus Budget, Angebot oder Rechnungen stammt.',
    ],
  },
  {
    version: '0.2.0',
    datum: '2026-09-27',
    titel: 'Vereinfachung: eine Rechnungsliste',
    punkte: [
      'Zahlungen werden nur noch über Rechnungen erfasst – das Bezahlt-Feld am Angebot entfällt.',
      'Rechnungen können einer Einheit zugeordnet werden, wenn ein Gewerk mehrere Einheiten betrifft.',
      'Rechnungen-Tab zeigt alle Rechnungen, inkl. derer zu Angeboten; Filter nach Gewerk und Einheit.',
      'Fertige Gewerke gelten erst als bezahlt, wenn alle Rechnungen bezahlt sind.',
      'Gewerk-Status vereinfacht: offen, beauftragt, in Arbeit, fertig.',
      'Sortieren per Klick auf die Spaltenüberschrift statt Auswahllisten; Gewerke nur noch als Liste.',
      'Passwort ist ein Pflichtfeld.',
      'Handy-Ansicht überarbeitet: Tabellen als Karten mit Bearbeiten-Knöpfen, Dialoge im Vollbild, Diagramm-Summen passen immer.',
      'Versionsanzeige im Header; Docker-Image auf Node 22.',
    ],
  },
  {
    version: '0.1.4',
    datum: '2026-09-26',
    titel: 'Rechnungen am Gewerk',
    punkte: [
      'Rechnungen direkt am Gewerk, ohne Angebot (z. B. Materialeinkauf).',
      'Eigener Tab „Rechnungen“.',
      'Watchtower schreibt eine Logdatei.',
    ],
  },
  {
    version: '0.1.3',
    datum: '2026-09-07',
    titel: 'Rechnungen an Angeboten',
    punkte: [
      'Rechnungen je Angebot; Bezahlt ergibt sich aus dem Rechnungsstatus.',
      'Gewerke direkt im Detail bearbeiten (automatisches Speichern).',
    ],
  },
  {
    version: '0.1.2',
    datum: '2026-09-04',
    titel: 'Einheiten-Analyse',
    punkte: [
      'Budgetdiagramme je Einheit, sortierbare Gewerke im Einheiten-Tab.',
      'Bezahlte Kosten ersetzen bei fertigen Gewerken den Planwert.',
    ],
  },
  {
    version: '0.1.1',
    datum: '2026-09-02',
    titel: 'Budgetplanung',
    punkte: [
      'Geplantes Budget je Gewerk, Budgetübersicht im Dashboard.',
      'Neues Design für Dashboard, Angebote, Gewerke und Einheiten; Zeitplan entfernt.',
    ],
  },
  {
    version: '0.1.0',
    datum: '2026-07-10',
    titel: 'Erste Version',
    punkte: [
      'Gewerke, Angebote und Einheiten verwalten; JSON- und Excel-Export.',
      'Passwortschutz, Kostenverteilung auf Einheiten, Docker-Deployment.',
    ],
  },
];

export const VERSION = CHANGELOG[0].version;

// Short commit hash, injected at build time (Docker/GitHub Actions); empty locally.
export const BUILD = import.meta.env.VITE_BUILD_SHA ? String(import.meta.env.VITE_BUILD_SHA).slice(0, 7) : '';
