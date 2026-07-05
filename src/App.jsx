import { useState, useEffect, useCallback } from 'react';
import { sampleData } from './data/sampleData';
import { generateId } from './utils/dateUtils';
import ProjectHeader from './components/ProjectHeader';
import ImportExportBar from './components/ImportExportBar';
import Dashboard from './components/Dashboard';
import AngeboteView from './components/AngeboteView';
import TimelineView from './components/TimelineView';
import GewerkeDetails from './components/GewerkeDetails';
import Modal from './components/Modal';
import './App.css';

const STORAGE_KEY = 'argus_project_data';

const NAV_ITEMS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'angebote', label: '📋 Angebote' },
  { id: 'zeitplan', label: '📅 Zeitplan' },
  { id: 'gewerke', label: '🔨 Gewerke' },
];

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

function ProjektForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name: '', adresse: '', budget: '', notizen: '' });
  function set(f, v) { setForm((p) => ({ ...p, [f]: v })); }
  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, budget: parseFloat(form.budget) || 0 }); }}>
      <div className="form-row">
        <label className="form-label">Projektname *</label>
        <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="form-row">
        <label className="form-label">Adresse</label>
        <input className="input" value={form.adresse} onChange={(e) => set('adresse', e.target.value)} />
      </div>
      <div className="form-row">
        <label className="form-label">Budget (€)</label>
        <input className="input" type="number" step="100" min="0" value={form.budget} onChange={(e) => set('budget', e.target.value)} />
      </div>
      <div className="form-row">
        <label className="form-label">Notizen</label>
        <textarea className="input textarea" rows={3} value={form.notizen} onChange={(e) => set('notizen', e.target.value)} />
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

  const [data, setData] = useState(() => loadFromStorage() || sampleData);

  const { projekt, gewerke, angebote, meilensteine } = data;

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore quota errors
    }
  }, [data]);

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

  // --- Import/Export ---
  function handleImport(imported) {
    if (!imported.projekt || !imported.gewerke || !imported.angebote) {
      alert('Ungültiges Format: Felder "projekt", "gewerke" und "angebote" werden erwartet.');
      return;
    }
    setData({
      projekt: imported.projekt,
      gewerke: imported.gewerke,
      angebote: imported.angebote,
      meilensteine: imported.meilensteine || [],
    });
    setSelectedGewerkId(null);
    setActiveTab('dashboard');
  }

  function handleNewProject() {
    if (window.confirm('Neues Projekt anlegen? Alle nicht gespeicherten Daten gehen verloren (Export vorher empfohlen).')) {
      setData({
        projekt: { id: generateId('proj'), name: 'Neues Projekt', adresse: '', budget: 0, notizen: '' },
        gewerke: [],
        angebote: [],
        meilensteine: [],
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
            onNavigate={handleNavigate}
          />
        );
      case 'angebote':
        return (
          <AngeboteView
            gewerke={gewerke}
            angebote={angebote}
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
      default:
        return null;
    }
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar${mobileNavOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-logo">
          <span className="logo-icon">🏗</span>
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
            onEdit={() => setShowProjectForm(true)}
          />
        </header>
        <main className="content">
          {renderContent()}
        </main>
      </div>

      {showProjectForm && (
        <Modal title="Projekt bearbeiten" onClose={() => setShowProjectForm(false)}>
          <ProjektForm
            initial={projekt}
            onSave={(updated) => {
              updateData({ projekt: { ...projekt, ...updated } });
              setShowProjectForm(false);
            }}
            onCancel={() => setShowProjectForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
