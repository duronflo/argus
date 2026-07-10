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

// Color map for trade categories
const KATEGORIE_COLORS = {
  'Elektro': '#2563eb',
  'Sanitär': '#0891b2',
  'Maler': '#7c3aed',
  'Boden': '#b45309',
  'Dach': '#64748b',
  'Dachdecker': '#475569',
  'Heizung': '#dc2626',
  'Fenster': '#059669',
  'Maurer': '#92400e',
  'Zimmerer': '#78350f',
  'Sonstiges': '#6b7280',
};

function getKatColor(kat) {
  return KATEGORIE_COLORS[kat] || '#2563eb';
}

function GanttChart({ gewerke, meilensteine }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Collect all dates
  const allDates = [];
  gewerke.forEach((g) => {
    if (g.geplanterStart) allDates.push(new Date(g.geplanterStart));
    if (g.geplantesEnde) allDates.push(new Date(g.geplantesEnde));
  });
  meilensteine.forEach((m) => {
    if (m.datum) allDates.push(new Date(m.datum));
  });

  if (allDates.length === 0) {
    return <p className="empty-state">Keine Gewerke mit Terminen für den Zeitplan.</p>;
  }

  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));

  // Extend range by some padding
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 14);


  function pct(date) {
    if (!date) return null;
    const d = new Date(date);
    return Math.max(0, Math.min(100, ((d - minDate) / (maxDate - minDate)) * 100));
  }

  // Group gewerke by kategorie
  const grouped = {};
  gewerke.forEach((g) => {
    const kat = g.kategorie || 'Sonstiges';
    if (!grouped[kat]) grouped[kat] = [];
    grouped[kat].push(g);
  });

  const sortedKats = Object.keys(grouped).sort();

  // Month markers
  const months = [];
  const cur = new Date(minDate);
  cur.setDate(1);
  while (cur <= maxDate) {
    const p = pct(cur);
    months.push({
      label: cur.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
      pct: p,
    });
    cur.setMonth(cur.getMonth() + 1);
  }

  const todayPct = pct(today);

  return (
    <div className="gantt-wrap">
      {/* Month axis */}
      <div className="gantt-axis">
        <div className="gantt-label-col" />
        <div className="gantt-bar-col gantt-axis-months">
          {months.map((m) => (
            <div key={m.pct} className="gantt-month-mark" style={{ left: `${m.pct}%` }}>
              <div className="gantt-month-line" />
              <span className="gantt-month-label">{m.label}</span>
            </div>
          ))}
          {todayPct !== null && (
            <div className="gantt-today-line" style={{ left: `${todayPct}%` }}>
              <span className="gantt-today-label">Heute</span>
            </div>
          )}
        </div>
      </div>

      {/* Gewerke rows grouped by category */}
      {sortedKats.map((kat) => (
        <div key={kat} className="gantt-kat-group">
          <div className="gantt-kat-header">
            <span className="gantt-kat-label" style={{ borderLeftColor: getKatColor(kat) }}>{kat}</span>
          </div>
          {grouped[kat].map((g) => {
            const start = g.geplanterStart ? pct(g.geplanterStart) : null;
            const end = g.geplantesEnde ? pct(g.geplantesEnde) : null;
            const actualStart = g.tatsaechlicherStart ? pct(g.tatsaechlicherStart) : null;
            const actualEnd = g.tatsaechlichesEnde ? pct(g.tatsaechlichesEnde) : (g.tatsaechlicherStart ? todayPct : null);
            const overdue = isOverdue(g.geplantesEnde, g.status);
            const color = getKatColor(kat);

            // Milestones for this gewerk
            const gwMs = meilensteine.filter((m) => m.gewerkId === g.id && m.datum);

            return (
              <div key={g.id} className="gantt-row">
                <div className="gantt-label-col">
                  <span className={`gantt-row-name${overdue ? ' gantt-row-name--overdue' : ''}`}>{g.name}</span>
                  <Badge status={g.status} small />
                </div>
                <div className="gantt-bar-col">
                  {/* Planned bar */}
                  {start !== null && end !== null && (
                    <div
                      className="gantt-bar gantt-bar--planned"
                      style={{
                        left: `${start}%`,
                        width: `${Math.max(0.5, end - start)}%`,
                        background: color,
                        opacity: overdue ? 0.5 : 0.85,
                      }}
                      title={`Geplant: ${formatDate(g.geplanterStart)} – ${formatDate(g.geplantesEnde)}`}
                    />
                  )}
                  {/* Actual bar */}
                  {actualStart !== null && actualEnd !== null && (
                    <div
                      className="gantt-bar gantt-bar--actual"
                      style={{
                        left: `${actualStart}%`,
                        width: `${Math.max(0.5, actualEnd - actualStart)}%`,
                        background: color,
                      }}
                      title={`Tatsächlich: ${formatDate(g.tatsaechlicherStart)}${g.tatsaechlichesEnde ? ' – ' + formatDate(g.tatsaechlichesEnde) : ' – heute'}`}
                    />
                  )}
                  {/* Milestones */}
                  {gwMs.map((m) => {
                    const mp = pct(m.datum);
                    return mp !== null ? (
                      <div
                        key={m.id}
                        className={`gantt-milestone${m.status === 'erledigt' ? ' gantt-milestone--done' : ''}`}
                        style={{ left: `${mp}%` }}
                        title={`${m.titel} (${formatDate(m.datum)})`}
                      />
                    ) : null;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Global milestones (no gewerk) */}
      {(() => {
        const globalMs = meilensteine.filter((m) => !m.gewerkId && m.datum);
        if (globalMs.length === 0) return null;
        return (
          <div className="gantt-kat-group">
            <div className="gantt-kat-header">
              <span className="gantt-kat-label" style={{ borderLeftColor: '#f59e0b' }}>Projektmeilensteine</span>
            </div>
            <div className="gantt-row">
              <div className="gantt-label-col">
                <span className="gantt-row-name">Meilensteine</span>
              </div>
              <div className="gantt-bar-col">
                {globalMs.map((m) => {
                  const mp = pct(m.datum);
                  return mp !== null ? (
                    <div
                      key={m.id}
                      className={`gantt-milestone gantt-milestone--global${m.status === 'erledigt' ? ' gantt-milestone--done' : ''}`}
                      style={{ left: `${mp}%` }}
                      title={`${m.titel} (${formatDate(m.datum)})`}
                    />
                  ) : null;
                })}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="gantt-legend">
        <span className="gantt-legend-item"><span className="gantt-legend-bar gantt-legend-bar--planned" />Geplant</span>
        <span className="gantt-legend-item"><span className="gantt-legend-bar gantt-legend-bar--actual" />Tatsächlich</span>
        <span className="gantt-legend-item"><span className="gantt-legend-diamond" />Meilenstein</span>
        <span className="gantt-legend-item"><span className="gantt-legend-diamond gantt-legend-diamond--done" />Erledigt</span>
      </div>
    </div>
  );
}

export default function TimelineView({ gewerke, meilensteine, onAddMilestone, onEditMilestone, onDeleteMilestone }) {
  const [showForm, setShowForm] = useState(false);
  const [editMs, setEditMs] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [view, setView] = useState('gantt'); // 'gantt' | 'list'

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
        <div className="timeline-header-actions">
          <div className="view-toggle">
            <button
              className={`btn btn-sm${view === 'gantt' ? ' btn-primary' : ' btn-secondary'}`}
              onClick={() => setView('gantt')}
            >📊 Gantt</button>
            <button
              className={`btn btn-sm${view === 'list' ? ' btn-primary' : ' btn-secondary'}`}
              onClick={() => setView('list')}
            >📋 Liste</button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditMs(null); setShowForm(true); }}>+ Meilenstein</button>
        </div>
      </div>

      {view === 'gantt' && (
        <div className="timeline-section" style={{ overflowX: 'auto' }}>
          <h3 className="subsection-title">Gewerke-Zeitplan</h3>
          <GanttChart gewerke={gewerke} meilensteine={meilensteine} />
        </div>
      )}

      {view === 'list' && (
        <div className="timeline-sections">
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
      )}

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
