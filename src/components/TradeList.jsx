import { useState } from 'react';
import Badge from './Badge';
import CategoryTag from './CategoryTag';
import { formatCurrency } from '../utils/dateUtils';
import { getEffektivesGewerkBudget } from '../utils/calculations';
import { getGewerkBarColor } from '../utils/colors';

function moveId(ids, draggedId, targetId) {
  const arr = [...ids];
  const from = arr.indexOf(draggedId);
  if (from === -1 || draggedId === targetId) return arr;
  arr.splice(from, 1);
  const to = arr.indexOf(targetId);
  arr.splice(to === -1 ? arr.length : to, 0, draggedId);
  return arr;
}

export default function TradeList({
  gewerke,
  angebote,
  einheiten,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onReorder,
}) {
  const [search, setSearch] = useState('');
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [filterEinheit, setFilterEinheit] = useState('');
  const [sortOrder, setSortOrder] = useState('custom');
  const [viewMode, setViewMode] = useState('list');
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const isCustomOrder = sortOrder === 'custom';
  const maxPlanned = gewerke.reduce((max, g) => Math.max(max, getEffektivesGewerkBudget(g, angebote)), 0);

  const filtered = gewerke.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.kategorie.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatuses.length > 0 ? filterStatuses.includes(g.status) : true;
    const matchEinheit = filterEinheit
      ? (g.einheitIds || []).includes(filterEinheit)
      : true;
    return matchSearch && matchStatus && matchEinheit;
  });

  const sorted = isCustomOrder ? filtered : [...filtered].sort((a, b) => {
    const direction = sortOrder.endsWith('-desc') ? -1 : 1;
    if (sortOrder.startsWith('budget-')) {
      return direction * (
        getEffektivesGewerkBudget(a, angebote) - getEffektivesGewerkBudget(b, angebote)
      );
    }
    if (sortOrder.startsWith('units-')) return direction * ((a.einheitIds || []).length - (b.einheitIds || []).length);
    const field = sortOrder.startsWith('category-') ? 'kategorie' : sortOrder.startsWith('status-') ? 'status' : 'name';
    return direction * a[field].localeCompare(b[field], 'de', { sensitivity: 'base' });
  });

  const tradeItems = sorted.map((g) => {
    const gwAngebote = angebote.filter((a) => a.gewerkId === g.id);
    const bezahlt = gwAngebote.reduce((s, a) => s + (a.bezahlt || 0), 0);
    const geplant = getEffektivesGewerkBudget(g, angebote);
    const assignedUnits = einheiten
      ? einheiten.filter((eh) => (g.einheitIds || []).includes(eh.id))
      : [];
    return { g, gwAngebote, bezahlt, geplant, assignedUnits };
  });

  function handleDrop(targetId) {
    if (draggedId && draggedId !== targetId) {
      const fullIds = gewerke.map((g) => g.id);
      onReorder(moveId(fullIds, draggedId, targetId));
    }
    setDraggedId(null);
    setDragOverId(null);
  }

  function toggleStatus(status) {
    setFilterStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  }

  return (
    <div className="trade-list">
      <div className="trade-list-header">
        <h2 className="section-title">Gewerke</h2>
        <div className="trade-list-header-actions">
          <div className="gewerke-view-toggle" role="group" aria-label="Ansicht auswählen">
            <button
              type="button"
              className={`btn btn-sm${viewMode === 'tiles' ? ' btn-primary' : ' btn-secondary'}`}
              aria-pressed={viewMode === 'tiles'}
              onClick={() => setViewMode('tiles')}
            >
              ▦ Kacheln
            </button>
            <button
              type="button"
              className={`btn btn-sm${viewMode === 'list' ? ' btn-primary' : ' btn-secondary'}`}
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
            >
              ☷ Liste
            </button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onAdd}>+ Neu</button>
        </div>
      </div>
      <div className="trade-list-filters">
        <input
          className="input"
          placeholder="Suche..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          aria-label="Gewerke sortieren"
        >
          <option value="custom">Eigene Reihenfolge (ziehen zum Sortieren)</option>
          <option value="name-asc">Name (A–Z)</option>
          <option value="name-desc">Name (Z–A)</option>
          <option value="category-asc">Kategorie (A–Z)</option>
          <option value="category-desc">Kategorie (Z–A)</option>
          <option value="status-asc">Status (A–Z)</option>
          <option value="status-desc">Status (Z–A)</option>
          <option value="budget-asc">Budget (aufsteigend)</option>
          <option value="budget-desc">Budget (absteigend)</option>
          <option value="units-asc">Einheiten (aufsteigend)</option>
          <option value="units-desc">Einheiten (absteigend)</option>
        </select>
        {einheiten && einheiten.length > 0 && (
          <select
            className="select"
            value={filterEinheit}
            onChange={(e) => setFilterEinheit(e.target.value)}
          >
            <option value="">Alle Einheiten</option>
            {[...einheiten].sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' })).map((eh) => (
              <option key={eh.id} value={eh.id}>{eh.name}</option>
            ))}
          </select>
        )}
      </div>
      <div className="status-filter-group" role="group" aria-label="Nach Status filtern">
        {['offen', 'angefragt', 'angeboten', 'beauftragt', 'in Arbeit', 'fertig'].map((s) => (
          <label key={s} className="status-filter-item">
            <input
              type="checkbox"
              checked={filterStatuses.includes(s)}
              onChange={() => toggleStatus(s)}
            />
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </label>
        ))}
        {filterStatuses.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFilterStatuses([])}>
            Zurücksetzen
          </button>
        )}
      </div>
      {sorted.length === 0 ? (
        <p className="empty-state">Keine Gewerke gefunden.</p>
      ) : viewMode === 'list' ? (
        <div className="table-wrap gewerke-list-wrap">
          <table className="table gewerke-list-table">
            <thead>
              <tr>
                <th>Gewerk</th>
                <th>Einheiten</th>
                <th className="text-right">Geplant</th>
                <th className="text-right">Bezahlt</th>
                <th className="text-right">Angebote</th>
                <th aria-label="Aktionen"></th>
              </tr>
            </thead>
            <tbody>
              {tradeItems.map(({ g, gwAngebote, bezahlt, geplant, assignedUnits }) => (
                <tr
                  key={g.id}
                  className={`${selectedId === g.id ? 'gewerke-list-row--active ' : ''}${draggedId === g.id ? 'gewerke-list-row--dragging ' : ''}${dragOverId === g.id && draggedId && draggedId !== g.id ? 'gewerke-list-row--drag-over' : ''}`}
                  onClick={() => onSelect(g.id)}
                  draggable={isCustomOrder}
                  onDragStart={() => setDraggedId(g.id)}
                  onDragOver={(e) => { if (isCustomOrder) { e.preventDefault(); setDragOverId(g.id); } }}
                  onDragLeave={() => setDragOverId((cur) => (cur === g.id ? null : cur))}
                  onDrop={(e) => { if (isCustomOrder) { e.preventDefault(); handleDrop(g.id); } }}
                  onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                >
                  <td>
                    <div className="gewerke-list-name">
                      {isCustomOrder && <span className="drag-handle" title="Ziehen zum Sortieren">⠿</span>}
                      <strong>{g.name}</strong>
                    </div>
                    <div className="gewerke-list-tags">
                      <CategoryTag kategorie={g.kategorie} small />
                      <Badge status={g.status} small />
                    </div>
                  </td>
                  <td>
                    <div className="gewerke-list-units">
                      {assignedUnits.length > 0
                        ? assignedUnits.map((eh) => <span key={eh.id} className="einheit-tag einheit-tag--sm">{eh.name}</span>)
                        : <span className="gewerke-list-muted">Keine</span>}
                    </div>
                  </td>
                  <td className="text-right">{geplant > 0 ? formatCurrency(geplant) : '—'}</td>
                  <td className="text-right">{bezahlt > 0 ? formatCurrency(bezahlt) : '—'}</td>
                  <td className="text-right">{gwAngebote.length}</td>
                  <td>
                    <button
                      className="btn-icon btn-icon--danger"
                      title="Löschen"
                      onClick={(e) => { e.stopPropagation(); onDelete(g.id); }}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="gewerke-grid">
          {tradeItems.map(({ g, gwAngebote, bezahlt, geplant, assignedUnits }) => {
            return (
              <div
                key={g.id}
                className={`gewerke-card${selectedId === g.id ? ' gewerke-card--active' : ''}${draggedId === g.id ? ' gewerke-card--dragging' : ''}${dragOverId === g.id && draggedId && draggedId !== g.id ? ' gewerke-card--drag-over' : ''}`}
                onClick={() => onSelect(g.id)}
                draggable={isCustomOrder}
                onDragStart={() => setDraggedId(g.id)}
                onDragOver={(e) => { if (isCustomOrder) { e.preventDefault(); setDragOverId(g.id); } }}
                onDragLeave={() => setDragOverId((cur) => (cur === g.id ? null : cur))}
                onDrop={(e) => { if (isCustomOrder) { e.preventDefault(); handleDrop(g.id); } }}
                onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
              >
                <div className="gewerke-card-header">
                  {isCustomOrder && <span className="drag-handle" title="Ziehen zum Sortieren">⠿</span>}
                  <div className="gewerke-card-title">
                    <span className="gewerke-card-name">{g.name}</span>
                    <div className="gewerke-card-tags">
                      <CategoryTag kategorie={g.kategorie} small />
                      <Badge status={g.status} small />
                    </div>
                  </div>
                  <button
                    className="btn-icon btn-icon--danger"
                    title="Löschen"
                    onClick={(e) => { e.stopPropagation(); onDelete(g.id); }}
                  >
                    🗑
                  </button>
                </div>

                {assignedUnits.length > 0 && (
                  <div className="gewerke-card-units">
                    {assignedUnits.map((eh) => (
                      <span key={eh.id} className="einheit-tag einheit-tag--sm">{eh.name}</span>
                    ))}
                  </div>
                )}

                <div className="gewerke-card-stats">
                  <div className="gewerke-card-stat">
                    <span className="gewerke-card-stat-label">Geplant</span>
                    <span className="gewerke-card-stat-value">{geplant > 0 ? formatCurrency(geplant) : '—'}</span>
                  </div>
                  <div className="gewerke-card-stat">
                    <span className="gewerke-card-stat-label">Bezahlt</span>
                    <span className="gewerke-card-stat-value">{bezahlt > 0 ? formatCurrency(bezahlt) : '—'}</span>
                  </div>
                  <div className="gewerke-card-stat">
                    <span className="gewerke-card-stat-label">Angebote</span>
                    <span className="gewerke-card-stat-value">{gwAngebote.length}</span>
                  </div>
                </div>
                {maxPlanned > 0 && (
                  <div className="gewerke-card-budget">
                    <div className="budget-bar" aria-label={`${g.status === 'fertig' ? 'Fertig' : 'Geplant'}: ${formatCurrency(geplant)}`}>
                      <div
                        className="budget-bar-fill"
                        style={{
                          width: `${Math.min((geplant / maxPlanned) * 100, 100)}%`,
                          background: getGewerkBarColor(g.status),
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
