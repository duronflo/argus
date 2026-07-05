import { useMemo, useState } from 'react';
import Badge from './Badge';
import Modal from './Modal';
import { formatDate, isOverdue, generateId } from '../utils/dateUtils';

const MILESTONE_STATUSES = ['offen', 'erledigt'];

function MilestoneForm({ initial, gewerke, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { titel: '', datum: '', status: 'offen', gewerkId: '' }
  );
  function set(f, v) { setForm((p) => ({ ...p, [f]: v })); }
  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <div className="form-row">
        <label className="form-label">Titel *</label>
        <input className="input" required value={form.titel} onChange={(e) => set('titel', e.target.value)} />
      </div>
      <div className="form-row">
        <label className="form-label">Datum</label>
        <input className="input" type="date" value={form.datum} onChange={(e) => set('datum', e.target.value)} />
      </div>
      <div className="form-row">
        <label className="form-label">Status</label>
        <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>
          {MILESTONE_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>
      <div className="form-row">
        <label className="form-label">Gewerk (optional)</label>
        <select className="select" value={form.gewerkId} onChange={(e) => set('gewerkId', e.target.value)}>
          <option value="">— kein Gewerk —</option>
          {gewerke.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn-primary">Speichern</button>
      </div>
    </form>
  );
}

export default function TimelineView({ gewerke, meilensteine, onAddMilestone, onEditMilestone, onDeleteMilestone }) {
  const [showForm, setShowForm] = useState(false);
  const [editMs, setEditMs] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const gewerkeItems = useMemo(() => {
    return gewerke
      .filter((g) => g.geplanterStart || g.geplantesEnde)
      .map((g) => ({
        id: g.id,
        titel: g.name,
        datum: g.geplanterStart || g.geplantesEnde,
        endDatum: g.geplantesEnde,
        type: 'gewerk',
        status: g.status,
        overdue: isOverdue(g.geplantesEnde, g.status),
      }))
      .sort((a, b) => new Date(a.datum) - new Date(b.datum));
  }, [gewerke]);

  const filteredMeilensteine = meilensteine
    .filter((m) => !filterStatus || m.status === filterStatus)
    .sort((a, b) => new Date(a.datum) - new Date(b.datum));

  // Group meilensteine by month
  const grouped = useMemo(() => {
    const map = {};
    filteredMeilensteine.forEach((m) => {
      const key = m.datum ? m.datum.slice(0, 7) : 'Kein Datum';
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredMeilensteine]);

  function monthLabel(key) {
    if (key === 'Kein Datum') return 'Kein Datum';
    const [year, month] = key.split('-');
    return new Date(year, parseInt(month) - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  }

  return (
    <div className="timeline-view">
      <div className="timeline-header">
        <h2 className="section-title">Zeitplan</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditMs(null); setShowForm(true); }}>+ Meilenstein</button>
      </div>

      <div className="timeline-sections">
        <section className="timeline-section">
          <h3 className="subsection-title">Gewerke-Zeitraum</h3>
          {gewerkeItems.length === 0 ? (
            <p className="empty-state">Keine Gewerke mit Terminen.</p>
          ) : (
            <div className="gewerk-timeline">
              {gewerkeItems.map((g) => (
                <div key={g.id} className={`gewerk-timeline-item${g.overdue ? ' gewerk-timeline-item--overdue' : ''}`}>
                  <div className="gtl-name">{g.titel}</div>
                  <div className="gtl-dates">
                    {formatDate(g.datum)}
                    {g.endDatum && g.endDatum !== g.datum && ` → ${formatDate(g.endDatum)}`}
                  </div>
                  <Badge status={g.status} small />
                  {g.overdue && <span className="overdue-badge">Überfällig</span>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="timeline-section">
          <div className="timeline-ms-header">
            <h3 className="subsection-title">Meilensteine & Termine</h3>
            <select
              className="select select-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Alle</option>
              <option value="offen">Offen</option>
              <option value="erledigt">Erledigt</option>
            </select>
          </div>

          {grouped.length === 0 ? (
            <p className="empty-state">Keine Meilensteine gefunden.</p>
          ) : (
            grouped.map(([key, items]) => (
              <div key={key} className="timeline-group">
                <div className="timeline-month">{monthLabel(key)}</div>
                <ul className="timeline-items">
                  {items.map((m) => {
                    const gewerk = m.gewerkId ? gewerke.find((g) => g.id === m.gewerkId) : null;
                    const overdue = m.status !== 'erledigt' && m.datum && new Date(m.datum) < new Date();
                    return (
                      <li key={m.id} className={`timeline-item${overdue ? ' timeline-item--overdue' : ''}`}>
                        <div className={`timeline-dot${m.status === 'erledigt' ? ' timeline-dot--done' : overdue ? ' timeline-dot--overdue' : ''}`} />
                        <div className="timeline-content">
                          <span className="timeline-title">{m.titel}</span>
                          {gewerk && <span className="timeline-gewerk">{gewerk.name}</span>}
                        </div>
                        <div className="timeline-right">
                          <span className="timeline-date">{formatDate(m.datum)}</span>
                          <Badge status={m.status} small />
                          <button className="btn-icon" onClick={() => { setEditMs(m); setShowForm(true); }}>✏</button>
                          <button className="btn-icon btn-icon--danger" onClick={() => setDeleteConfirm(m.id)}>🗑</button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </section>
      </div>

      {showForm && (
        <Modal
          title={editMs ? 'Meilenstein bearbeiten' : 'Neuer Meilenstein'}
          onClose={() => setShowForm(false)}
        >
          <MilestoneForm
            initial={editMs}
            gewerke={gewerke}
            onSave={(data) => {
              if (editMs) {
                onEditMilestone({ ...editMs, ...data });
              } else {
                onAddMilestone({ ...data, id: generateId('ms') });
              }
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Meilenstein löschen?" onClose={() => setDeleteConfirm(null)} width={380}>
          <p>Soll dieser Meilenstein wirklich gelöscht werden?</p>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Abbrechen</button>
            <button className="btn btn-danger" onClick={() => { onDeleteMilestone(deleteConfirm); setDeleteConfirm(null); }}>Löschen</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
