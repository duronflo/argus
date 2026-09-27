import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
// In Docker the DB lives in a dedicated data volume (/app/data/); locally it
// falls back to a "data/" sibling of the project root so it is never committed.
const DB_PATH = process.env.DB_PATH || join(__dirname, '..', 'data', 'data.db');

// Ensure the parent directory exists (important for the first local run)
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Create table for project data (single JSON blob per project)
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id    INTEGER PRIMARY KEY,
    data  TEXT    NOT NULL
  )
`);

// Copies of the project taken right before a data-model upgrade overwrites it
// (restore manually via SQLite if a migration ever goes wrong).
db.exec(`
  CREATE TABLE IF NOT EXISTS project_backups (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    schema      INTEGER NOT NULL,
    data        TEXT    NOT NULL
  )
`);

const schemaOf = (project) => project?.schemaVersion || 1;

export function getProject() {
  const row = db.prepare('SELECT data FROM projects WHERE id = 1').get();
  if (!row) return null;
  return JSON.parse(row.data);
}

export const saveProject = db.transaction((data) => {
  const row = db.prepare('SELECT data FROM projects WHERE id = 1').get();
  const current = row ? JSON.parse(row.data) : null;
  if (current && schemaOf(data) > schemaOf(current)) {
    db.prepare('INSERT INTO project_backups (schema, data) VALUES (?, ?)').run(schemaOf(current), row.data);
  }
  db.prepare(`
    INSERT INTO projects (id, data) VALUES (1, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data
  `).run(JSON.stringify(data));
});
