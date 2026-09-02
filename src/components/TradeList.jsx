import { useState } from 'react';
import Badge from './Badge';
import CategoryTag from './CategoryTag';
import { formatCurrency } from '../utils/dateUtils';

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
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const isCustomOrder = sortOrder === 'custom';

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
    if (sortOrder.startsWith('budget-')) return direction * ((a.geplantBudget || 0) - (b.geplantBudget || 0));
    if (sortOrder.startsWith('units-')) return direction * ((a.einheitIds || []).length - (b.einheitIds || []).length);
    const field = sortOrder.startsWith('category-') ? 'kategorie' : sortOrder.startsWith('status-') ? 'status' : 'name';
    return direction * a[field].localeCompare(b[field], 'de', { sensitivity: 'base' });
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
        <button className="btn btn-primary btn-sm" onClick={onAdd}>+ Neu</button>
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
      ) : (
        <div className="gewerke-grid">
          {sorted.map((g) => {
            const gwAngebote = angebote.filter((a) => a.gewerkId === g.id);
            const bezahlt = gwAngebote.reduce((s, a) => s + (a.bezahlt || 0), 0);
            const assignedUnits = einheiten
              ? einheiten.filter((eh) => (g.einheitIds || []).includes(eh.id))
              : [];
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
                    <span className="gewerke-card-stat-value">{g.geplantBudget > 0 ? formatCurrency(g.geplantBudget) : '—'}</span>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
