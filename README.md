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
- **JSON-Export & JSON-Import** für vollständige Datensicherung und -wiederherstellung
- **Excel-Export** aller Daten (Projekt, Einheiten, Gewerke, Angebote, Meilensteine) als `.xlsx`
- **Gesamtbudget aus Einheiten-Budgets** – wird automatisch aus den Einheiten abgeleitet
- Datenhaltung auf dem Server (SQLite), localStorage als Offline-Cache

## Technisch

- React 19 + Vite (Frontend)
- Node.js + Express + SQLite (`better-sqlite3`) (Backend)
- Kein separates Datenbankserver nötig – SQLite läuft direkt im Container
- Responsive für Desktop und Mobil

## Lokale Entwicklung

Zwei Prozesse starten (je in eigenem Terminal):

```bash
# Terminal 1: Backend-Server (Port 3000)
npm run server

# Terminal 2: Vite Dev-Server (Port 5173, proxied an Port 3000)
npm run dev
```

Dann http://localhost:5173 im Browser öffnen. Vite proxied `/api`-Anfragen automatisch an den Express-Server.

## Build

```bash
npm run build
npm run start   # Startet Express, der dist/ + API auf Port 3000 ausliefert
```

## Linting

```bash
npm run lint
```

## Docker (Produktion)

### Voraussetzungen

- Docker + Docker Compose auf dem Server
- Zugriff auf das GitHub Container Registry Image (GHCR)

### Starten

```bash
docker compose up -d
```

Die App läuft dann auf http://localhost:3000.

Die SQLite-Datenbank wird im Docker-Volume `argus-data` persistiert und überlebt Container-Updates.

### Automatische Updates (Watchtower)

`docker-compose.yml` enthält einen **Watchtower**-Container, der alle 5 Minuten prüft, ob ein neues Image für `argus` verfügbar ist. Wenn ja, zieht er das neue Image und startet den Container neu – komplett automatisch.

**Update-Flow:**

1. Code-Änderung auf `main` pushen
2. GitHub Actions baut das Docker-Image und pusht es nach `ghcr.io/duronflo/argus:latest`
3. Watchtower erkennt das neue Image innerhalb von 5 Minuten
4. Watchtower zieht das neue Image und startet den Container neu
5. Datenbank bleibt erhalten (Volume)

### Erstes Setup auf dem Server

```bash
# Repository klonen oder docker-compose.yml herunterladen
docker compose pull
docker compose up -d
```

### Image manuell bauen (optional)

```bash
docker build -t argus .
```

## Portainer

### Erstinstallation

1. In Portainer **Stacks → Add stack** öffnen.
2. Stack-Name vergeben, z. B. `argus`.
3. Den Inhalt der `docker-compose.yml` aus diesem Repository in das Editor-Feld einfügen.
4. Unter **Environment variables** können bei Bedarf Werte überschrieben werden (z. B. `PORT`).
5. **Deploy the stack** klicken.

Die App ist danach unter `http://<server-ip>:3000` erreichbar.  
Das SQLite-Volume `argus-data` wird automatisch angelegt und überlebt alle Updates.

### Update

Da der Stack den **Watchtower**-Container enthält, werden Updates vollautomatisch eingespielt (alle 5 Minuten wird auf ein neues Image geprüft). Ein manuelles Update ist trotzdem jederzeit möglich:

**Manuell über Portainer:**

1. Stack in Portainer öffnen → **Editor**-Tab.
2. Ohne Änderungen direkt **Update the stack** klicken.  
   Portainer zieht dabei das aktuelle Image und startet den Container neu.

**Alternativ über die Portainer-Container-Ansicht:**

1. Container `argus` in der Container-Liste auswählen.
2. **Recreate** → **Re-pull image** aktivieren → bestätigen.

Die Datenbank bleibt in beiden Fällen erhalten, da sie im Volume `argus-data` liegt.
