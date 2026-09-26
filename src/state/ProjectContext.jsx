import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { sampleData } from '../data/sampleData';
import { migrate } from '../domain/migrate';
import { buildModel } from '../domain/model';
import { removeItem, reorderGewerke, saveItem } from '../domain/actions';
import { generateId } from '../utils/dateUtils';

const STORAGE_KEY = 'argus_project_data';
const SAVE_DEBOUNCE_MS = 800;
const ID_PREFIX = { gewerke: 'gw', angebote: 'ao', rechnungen: 'rg', einheiten: 'eh' };

async function fetchProjectFromServer() {
  const res = await fetch('/api/project');
  if (!res.ok) return null;
  return res.json();
}

async function saveProjectToServer(data) {
  await fetch('/api/project', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// localStorage is kept only as an offline fallback / cache
function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch {
    // ignore
  }
  return null;
}

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  // Start with localStorage cache for instant render; server data overwrites it
  const [data, setData] = useState(() => loadFromLocalStorage() || migrate(sampleData));
  const [loading, setLoading] = useState(true);
  const [openGewerkId, setOpenGewerkId] = useState(null);

  useEffect(() => {
    fetchProjectFromServer()
      .then((serverData) => { if (serverData) setData(migrate(serverData)); })
      .catch(() => {/* server unreachable – keep local data */})
      .finally(() => setLoading(false));
  }, []);

  // Debounced server save + localStorage mirror
  const saveTimer = useRef(null);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (loading) return; // don't save during initial load
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore quota errors
    }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProjectToServer(data).catch(() => {/* ignore save errors silently */});
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(saveTimer.current);
  }, [data, loading]);

  const model = useMemo(() => buildModel(data), [data]);

  const actions = useMemo(() => ({
    /** Adds or replaces an item; returns its id (generated for new items). */
    save(collection, item) {
      const withId = item.id ? item : { ...item, id: generateId(ID_PREFIX[collection]) };
      setData((prev) => saveItem(prev, collection, withId));
      return withId.id;
    },
    remove(collection, id) {
      setData((prev) => removeItem(prev, collection, id));
      if (collection === 'gewerke') setOpenGewerkId((cur) => (cur === id ? null : cur));
    },
    reorderGewerke(ids) {
      setData((prev) => reorderGewerke(prev, ids));
    },
    updateProjekt(projekt, kategorien) {
      setData((prev) => ({ ...prev, projekt: { ...prev.projekt, ...projekt }, kategorien }));
    },
    /** Replaces the whole project (import / new project); old formats are migrated. */
    replaceAll(next) {
      setData(migrate(next));
      setOpenGewerkId(null);
    },
    openGewerk: setOpenGewerkId,
  }), []);

  const value = useMemo(
    () => ({ data, model, loading, openGewerkId, actions }),
    [data, model, loading, openGewerkId, actions],
  );
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

// eslint-disable-next-line react/only-export-components -- hook belongs next to its provider
export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used inside <ProjectProvider>');
  return ctx;
}
