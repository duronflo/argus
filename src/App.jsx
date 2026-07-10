import { useState, useEffect, useCallback, useRef } from 'react';
import { sampleData, DEFAULT_KATEGORIEN } from './data/sampleData';
import { generateId } from './utils/dateUtils';
import ProjectHeader from './components/ProjectHeader';
import ImportExportBar from './components/ImportExportBar';
import Dashboard from './components/Dashboard';
import AngeboteView from './components/AngeboteView';
import TimelineView from './components/TimelineView';
import GewerkeDetails from './components/GewerkeDetails';
import EinheitenView from './components/EinheitenView';
import Modal from './components/Modal';
import PasswordGate, { ArgusLogoSvg } from './components/PasswordGate';
import { isAuthenticated, authenticate } from './utils/auth';
import './App.css';

const STORAGE_KEY = 'argus_project_data';
const SAVE_DEBOUNCE_MS = 800;

const NAV_ITEMS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'angebote', label: '📋 Angebote' },
  { id: 'zeitplan', label: '📅 Zeitplan' },
  { id: 'gewerke', label: '🔨 Gewerke' },
  { id: 'einheiten', label: '🏠 Einheiten' },
];

// ---------------------------------------------------------------------------
// Server persistence helpers
// ---------------------------------------------------------------------------
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
    if (raw) {
      const parsed = JSON.parse(raw);
      return migrateData(parsed);
    }
  } catch {
    // ignore
  }
  return null;
}

function migrateData(parsed) {
  if (!parsed) return parsed;
  if (!parsed.einheiten) parsed.einheiten = [];
  if (!parsed.kategorien) parsed.kategorien = [...DEFAULT_KATEGORIEN];
  if (!parsed.projekt.password) parsed.projekt = { ...parsed.projekt, password: '0000' };
  if (parsed.gewerke) {
    parsed.gewerke = parsed.gewerke.map((g) => {
      const g2 = g.einheitIds ? g : { ...g, einheitIds: [] };
      if (!g2.einheitAnteile) {
        const ids = g2.einheitIds || [];
        const pct = ids.length > 0 ? Math.round(100 / ids.length) : 0;
        const anteile = {};
        ids.forEach((id, i) => {
          anteile[id] = i === ids.length - 1 ? 100 - pct * (ids.length - 1) : pct;
        });
        return { ...g2, einheitAnteile: anteile };
      }
      return g2;
    });
  }
  return parsed;
}

function ProjektForm({ initial, einheiten = [], kategorien = [], onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name: '', adresse: '', budget: '', notizen: '', password: '0000' });
  const [kats, setKats] = useState(kategorien);
  const [newKat, setNewKat] = useState('');
  function set(f, v) { setForm((p) => ({ ...p, [f]: v })); }
  const hasDerivedBudget = einheiten.some((e) => (e.budget || 0) > 0);

  function addKat() {
    const trimmed = newKat.trim();
    if (trimmed && !kats.includes(trimmed)) {
      setKats((k) => [...k, trimmed]);
    }
    setNewKat('');
  }

  function removeKat(k) {
    setKats((prev) => prev.filter((x) => x !== k));
  }

  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, budget: parseFloat(form.budget) || 0 }, kats); }}>
      <div className="form-row">
        <label className="form-label">Projektname *</label>
        <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="form-row">
        <label className="form-label">Adresse</label>
        <input className="input" value={form.adresse} onChange={(e) => set('adresse', e.target.value)} />
      </div>
      <div className="form-row">
        <label className="form-label">
          Budget (€)
          {hasDerivedBudget && (
            <span className="budget-derived-hint" title="Das Gesamtbudget wird aus den Einheiten-Budgets abgeleitet. Dieses Feld dient als Fallback.">
              {' '}– wird aus Einheiten abgeleitet
            </span>
          )}
        </label>
        <input
          className="input"
          type="number"
          step="100"
          min="0"
          value={form.budget}
          onChange={(e) => set('budget', e.target.value)}
          placeholder={hasDerivedBudget ? 'Fallback (optional)' : ''}
        />
      </div>
      <div className="form-row">
        <label className="form-label">Notizen</label>
        <textarea className="input textarea" rows={3} value={form.notizen} onChange={(e) => set('notizen', e.target.value)} />
      </div>
      <div className="form-row">
        <label className="form-label">Passwort</label>
        <input className="input" type="text" value={form.password || ''} onChange={(e) => set('password', e.target.value)} placeholder="Passwort (leer = kein Schutz)" />
        <span className="form-hint">Ändert das Passwort für den Zugriffsschutz. Aktuelles Cookie bleibt bis zum nächsten Login gültig.</span>
      </div>
      <div className="form-row">
        <label className="form-label">Kategorien (Gewerke)</label>
        <div className="kat-list">
          {kats.map((k) => (
            <span key={k} className="kat-tag">
              {k}
              <button type="button" className="kat-tag-remove" onClick={() => removeKat(k)} title="Entfernen">×</button>
            </span>
          ))}
        </div>
        <div className="kat-add-row">
          <input
            className="input"
            value={newKat}
            onChange={(e) => setNewKat(e.target.value)}
            placeholder="Neue Kategorie…"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKat(); } }}
          />
          <button type="button" className="btn btn-secondary btn-sm" onClick={addKat}>+ Hinzufügen</button>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn-primary">Speichern</button>
      </div>
    </form>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedGewerkId, setSelectedGewerkId] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  // Start with localStorage cache for instant render; server data overwrites it
  const [data, setData] = useState(() => loadFromLocalStorage() || sampleData);

  const { projekt, gewerke, angebote, meilensteine, einheiten, kategorien } = data;

  // Check cookie auth after data is loaded
  useEffect(() => {
    if (!loading) {
      const pw = data.projekt?.password || '0000';
      setUnlocked(!pw || isAuthenticated(pw));
    }
  }, [loading, data.projekt?.password]);

  // On mount: fetch from server, fall back to localStorage/sampleData
  useEffect(() => {
    fetchProjectFromServer()
      .then((serverData) => {
        if (serverData) {
          setData(migrateData(serverData));
        }
      })
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

  function updateData(partial) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  // Navigation helper called from Dashboard
  const handleNavigate = useCallback((tab, gewerkId) => {
    setActiveTab(tab);
    if (gewerkId) setSelectedGewerkId(gewerkId);
  }, []);

  // --- Gewerke CRUD ---
  function addGewerk(gewerk) {
    updateData({ gewerke: [...gewerke, gewerk] });
    setSelectedGewerkId(gewerk.id);
  }
  function editGewerk(updated) {
    updateData({ gewerke: gewerke.map((g) => g.id === updated.id ? updated : g) });
  }
  function deleteGewerk(id) {
    updateData({
      gewerke: gewerke.filter((g) => g.id !== id),
      angebote: angebote.filter((a) => a.gewerkId !== id),
    });
    if (selectedGewerkId === id) setSelectedGewerkId(null);
  }

  // --- Angebote CRUD ---
  function addAngebot(angebot) {
    updateData({ angebote: [...angebote, angebot] });
  }
  function editAngebot(updated) {
    updateData({ angebote: angebote.map((a) => a.id === updated.id ? updated : a) });
  }
  function deleteAngebot(id) {
    updateData({ angebote: angebote.filter((a) => a.id !== id) });
  }

  // --- Meilensteine CRUD ---
  function addMilestone(ms) {
    updateData({ meilensteine: [...meilensteine, ms] });
  }
  function editMilestone(updated) {
    updateData({ meilensteine: meilensteine.map((m) => m.id === updated.id ? updated : m) });
  }
  function deleteMilestone(id) {
    updateData({ meilensteine: meilensteine.filter((m) => m.id !== id) });
  }

  // --- Einheiten CRUD ---
  function addEinheit(einheit) {
    updateData({ einheiten: [...einheiten, einheit] });
  }
  function editEinheit(updated) {
    updateData({ einheiten: einheiten.map((e) => e.id === updated.id ? updated : e) });
  }
  function deleteEinheit(id) {
    updateData({
      einheiten: einheiten.filter((e) => e.id !== id),
      gewerke: gewerke.map((g) => ({
        ...g,
        einheitIds: (g.einheitIds || []).filter((eid) => eid !== id),
      })),
    });
  }

  function handleImport(imported) {
    if (!imported.projekt || !imported.gewerke || !imported.angebote) {
      alert('Ungültiges Format: Felder "projekt", "gewerke" und "angebote" werden erwartet.');
      return;
    }
    setData(migrateData({
      projekt: imported.projekt,
      gewerke: imported.gewerke,
      angebote: imported.angebote,
      meilensteine: imported.meilensteine || [],
      einheiten: imported.einheiten || [],
      kategorien: imported.kategorien || [...DEFAULT_KATEGORIEN],
    }));
    setSelectedGewerkId(null);
    setActiveTab('dashboard');
  }

  function handleNewProject() {
    if (window.confirm('Neues Projekt anlegen? Alle nicht gespeicherten Daten gehen verloren (Export vorher empfohlen).')) {
      setData({
        projekt: { id: generateId('proj'), name: 'Neues Projekt', adresse: '', budget: 0, notizen: '', password: '0000' },
        gewerke: [],
        angebote: [],
        meilensteine: [],
        einheiten: [],
        kategorien: [...DEFAULT_KATEGORIEN],
      });
      setSelectedGewerkId(null);
      setActiveTab('dashboard');
    }
  }

  function renderContent() {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            projekt={projekt}
            gewerke={gewerke}
            angebote={angebote}
            meilensteine={meilensteine}
            einheiten={einheiten}
            onNavigate={handleNavigate}
          />
        );
      case 'angebote':
        return (
          <AngeboteView
            gewerke={gewerke}
            angebote={angebote}
            einheiten={einheiten}
            onNavigate={handleNavigate}
          />
        );
      case 'zeitplan':
        return (
          <TimelineView
            gewerke={gewerke}
            meilensteine={meilensteine}
            onAddMilestone={addMilestone}
            onEditMilestone={editMilestone}
            onDeleteMilestone={deleteMilestone}
          />
        );
      case 'gewerke':
        return (
          <GewerkeDetails
            gewerke={gewerke}
            angebote={angebote}
            einheiten={einheiten}
            kategorien={kategorien || []}
            selectedGewerkId={selectedGewerkId}
            onSelectGewerk={setSelectedGewerkId}
            onAddGewerk={addGewerk}
            onEditGewerk={editGewerk}
            onDeleteGewerk={deleteGewerk}
            onAddAngebot={addAngebot}
            onEditAngebot={editAngebot}
            onDeleteAngebot={deleteAngebot}
          />
        );
      case 'einheiten':
        return (
          <EinheitenView
            einheiten={einheiten}
            gewerke={gewerke}
            angebote={angebote}
            onAddEinheit={addEinheit}
            onEditEinheit={editEinheit}
            onDeleteEinheit={deleteEinheit}
          />
        );
      default:
        return null;
    }
  }

  const currentPw = (projekt && projekt.password) || '0000';
  if (!loading && !unlocked) {
    return (
      <PasswordGate
        value={currentPw}
        onUnlock={() => setUnlocked(true)}
      />
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar${mobileNavOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-logo">
          <ArgusLogoSvg size={28} />
          <span className="logo-text">Argus</span>
          <button className="sidebar-close" onClick={() => setMobileNavOpen(false)}>✕</button>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item${activeTab === item.id ? ' nav-item--active' : ''}`}
              onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn btn-ghost btn-sm sidebar-new" onClick={handleNewProject}>+ Neues Projekt</button>
          <ImportExportBar projectData={data} onImport={handleImport} />
        </div>
      </aside>

      {/* Mobile nav overlay */}
      {mobileNavOpen && <div className="mobile-overlay" onClick={() => setMobileNavOpen(false)} />}

      {/* Main content */}
      <div className="main-wrap">
        <header className="topbar">
          <button className="hamburger" onClick={() => setMobileNavOpen(true)} aria-label="Menü öffnen">
            ☰
          </button>
          <ProjectHeader
            projekt={projekt}
            angebote={angebote}
            einheiten={einheiten}
            gewerke={gewerke}
            onEdit={() => setShowProjectForm(true)}
          />
        </header>
        <main className="content">
          {loading && (
            <div className="loading-overlay">
              <span className="loading-spinner" />
              <span>Daten werden geladen…</span>
            </div>
          )}
          {!loading && renderContent()}
        </main>
      </div>

      {showProjectForm && (
        <Modal title="Projekt bearbeiten" onClose={() => setShowProjectForm(false)}>
          <ProjektForm
            initial={projekt}
            einheiten={einheiten}
            kategorien={kategorien || []}
            onSave={(updated, updatedKats) => {
              updateData({ projekt: { ...projekt, ...updated }, kategorien: updatedKats });
              // Update auth cookie if password changed
              if (updated.password) authenticate(updated.password);
              setShowProjectForm(false);
            }}
            onCancel={() => setShowProjectForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
