import { useEffect, useState } from 'react';
import { DEFAULT_KATEGORIEN } from './data/sampleData';
import { SCHEMA_VERSION } from './domain/migrate';
import { generateId } from './utils/dateUtils';
import { useProject } from './state/ProjectContext';
import ProjectHeader from './components/ProjectHeader';
import ProjektForm from './components/ProjektForm';
import ImportExportBar from './components/ImportExportBar';
import Dashboard from './components/Dashboard';
import AngeboteView from './components/AngeboteView';
import GewerkeDetails from './components/GewerkeDetails';
import EinheitenView from './components/EinheitenView';
import RechnungenView from './components/RechnungenView';
import TradeDetail from './components/TradeDetail';
import Modal from './components/Modal';
import PasswordGate, { ArgusLogoSvg } from './components/PasswordGate';
import { isAuthenticated, authenticate } from './utils/auth';
import './App.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: '📊 Dashboard', View: Dashboard },
  { id: 'einheiten', label: '🏠 Einheiten', View: EinheitenView },
  { id: 'gewerke', label: '🔨 Gewerke', View: GewerkeDetails },
  { id: 'angebote', label: '📋 Angebote', View: AngeboteView },
  { id: 'rechnungen', label: '📄 Rechnungen', View: RechnungenView },
];

export default function App() {
  const { data, loading, openGewerkId, actions } = useProject();
  const { projekt, einheiten, kategorien } = data;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  // Check cookie auth after data is loaded
  useEffect(() => {
    if (!loading) {
      const pw = projekt?.password || '0000';
      setUnlocked(!pw || isAuthenticated(pw));
    }
  }, [loading, projekt?.password]);

  function handleImport(imported) {
    if (!imported.projekt || !imported.gewerke || !imported.angebote) {
      alert('Ungültiges Format: Felder "projekt", "gewerke" und "angebote" werden erwartet.');
      return;
    }
    actions.replaceAll(imported);
    setActiveTab('dashboard');
  }

  function handleNewProject() {
    if (window.confirm('Neues Projekt anlegen? Alle nicht gespeicherten Daten gehen verloren (Export vorher empfohlen).')) {
      actions.replaceAll({
        schemaVersion: SCHEMA_VERSION,
        projekt: { id: generateId('proj'), name: 'Neues Projekt', adresse: '', budget: 0, notizen: '', password: '0000' },
        kategorien: [...DEFAULT_KATEGORIEN],
        einheiten: [],
        gewerke: [],
        angebote: [],
        rechnungen: [],
      });
      setActiveTab('dashboard');
    }
  }

  const currentPw = projekt?.password || '0000';
  if (!loading && !unlocked) {
    return <PasswordGate value={currentPw} onUnlock={() => setUnlocked(true)} />;
  }

  const ActiveView = NAV_ITEMS.find((item) => item.id === activeTab)?.View;
  const openGewerk = data.gewerke.find((g) => g.id === openGewerkId);

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
          <ImportExportBar onImport={handleImport} />
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
          <ProjectHeader projekt={projekt} onEdit={() => setShowProjectForm(true)} />
        </header>
        <main className="content">
          {loading ? (
            <div className="loading-overlay">
              <span className="loading-spinner" />
              <span>Daten werden geladen…</span>
            </div>
          ) : (
            ActiveView && <ActiveView onNavigate={setActiveTab} />
          )}
        </main>
      </div>

      {/* One trade dialog for the whole app – opened from every tab */}
      {openGewerk && (
        <Modal title={openGewerk.name} onClose={() => actions.openGewerk(null)} width={820}>
          <TradeDetail gewerkId={openGewerk.id} />
        </Modal>
      )}

      {showProjectForm && (
        <Modal title="Projekt bearbeiten" onClose={() => setShowProjectForm(false)}>
          <ProjektForm
            initial={projekt}
            einheiten={einheiten}
            kategorien={kategorien || []}
            onSave={(updated, updatedKats) => {
              actions.updateProjekt(updated, updatedKats);
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
