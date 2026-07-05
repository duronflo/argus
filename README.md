# Argus – Bauprojekt-Verwaltung

Eine einfache React Web App zur Verwaltung von Bau- und Renovierungsangeboten, Kosten und Zeitplanung für private Bauherren.

## Features

- **Dashboard** mit KPI-Karten (Gewerke, Angebote, Beauftragt, Bezahlt) und Übersicht der nächsten Termine
- **Angebote** – Alle Angebote nach Gewerk gruppiert, filterbar nach Status oder Anbieter/Titel
- **Zeitplan** – Gewerke-Termine und Meilensteine nach Monat gruppiert, inkl. Überfälligkeitswarnung
- **Gewerke/Details** – CRUD für Gewerke und Angebote je Gewerk, inkl. Summenberechnung
- Ampellogik / Badges für alle Status
- Warnung wenn bezahlt > beauftragt oder Enddatum überschritten
- Bestätigungsdialog vor dem Löschen
- JSON-Export & JSON-Import für vollständige Datensicherung und -wiederherstellung
- Automatisches Speichern im localStorage

## Technisch

- React 19 + Vite
- Kein Backend, keine Datenbank
- Datenhaltung im React-State + localStorage (automatisch)
- Responsive für Desktop und Mobil

## Starten

```bash
npm install
npm run dev
```

Dann http://localhost:5173 im Browser öffnen. Die App startet mit Beispieldaten.

## Build

```bash
npm run build
npm run preview
```

## Linting

```bash
npm run lint
```
