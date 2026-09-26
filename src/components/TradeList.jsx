import { useState } from 'react';
import Badge, { GewerkPaymentBadge } from './Badge';
import CategoryTag from './CategoryTag';
import SortTh from './SortHeader';
import { formatCurrency } from '../utils/dateUtils';
import { moveId } from '../utils/moveId';
import { sortBy, useSort } from '../utils/sort';
import { GEWERK_STATUSES, statusLabel } from '../domain/constants';
import { useProject } from '../state/ProjectContext';

export default function TradeList({ onAdd, onDelete }) {
  const { data, model, openGewerkId: selectedId, actions } = useProject();
  const { gewerke, einheiten } = data;
  const [search, setSearch] = useState('');
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [filterEinheit, setFilterEinheit] = useState('');
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const sorting = useSort(null);
  // Drag & drop defines the own order; it only applies while no column is sorted.
  const isCustomOrder = !sorting.sort;

  const query = search.toLowerCase();
  const filtered = gewerke.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(query) || g.kategorie.toLowerCase().includes(query);
    const matchStatus = filterStatuses.length > 0 ? filterStatuses.includes(g.status) : true;
    const matchEinheit = filterEinheit ? model.gewerk(g.id).einheitIds.includes(filterEinheit) : true;
    return matchSearch && matchStatus && matchEinheit;
  });

  const sorted = sortBy(filtered, sorting.sort, {
    name: (g) => g.name,
    status: (g) => GEWERK_STATUSES.indexOf(g.status),
    einheiten: (g) => model.gewerk(g.id).einheitIds.length,
    geplant: (g) => model.gewerk(g.id).geplant,
    bezahlt: (g) => model.gewerk(g.id).bezahlt,
    angebote: (g) => model.gewerk(g.id).anzahlAngebote,
  });

  function handleDrop(targetId) {
    if (draggedId && draggedId !== targetId) {
      actions.reorderGewerke(moveId(gewerke.map((g) => g.id), draggedId, targetId));
    }
    setDraggedId(null);
    setDragOverId(null);
  }

  function toggleStatus(status) {
    setFilterStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]));
  }

  return (
    <div className="trade-list">
      <div className="trade-list-header">
        <h2 className="section-title">Gewerke</h2>
        <div className="trade-list-header-actions">
          {!isCustomOrder && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={sorting.reset}>↺ Eigene Reihenfolge</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={onAdd}>+ Neu</button>
        </div>
      </div>
      <div className="trade-list-filters">
        <input className="input" placeholder="Suche nach Name oder Kategorie…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {einheiten.length > 0 && (
          <select className="select" value={filterEinheit} onChange={(e) => setFilterEinheit(e.target.value)} aria-label="Nach Einheit filtern">
            <option value="">Alle Einheiten</option>
            {[...einheiten].sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' })).map((eh) => (
              <option key={eh.id} value={eh.id}>{eh.name}</option>
            ))}
          </select>
        )}
      </div>
      <div className="status-filter-group" role="group" aria-label="Nach Status filtern">
        {GEWERK_STATUSES.map((s) => (
          <label key={s} className="status-filter-item">
            <input type="checkbox" checked={filterStatuses.includes(s)} onChange={() => toggleStatus(s)} />
            {statusLabel(s)}
          </label>
        ))}
        {filterStatuses.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFilterStatuses([])}>Zurücksetzen</button>
        )}
      </div>
      <p className="form-hint trade-list-hint">
        {isCustomOrder
          ? 'Zeilen ziehen, um die Reihenfolge zu ändern. Klick auf eine Spaltenüberschrift sortiert.'
          : 'Sortiert nach Spalte – erneut klicken kehrt die Richtung um, ein dritter Klick stellt die eigene Reihenfolge wieder her.'}
      </p>
      {sorted.length === 0 ? (
        <p className="empty-state">Keine Gewerke gefunden.</p>
      ) : (
        <div className="table-wrap gewerke-list-wrap">
          <table className="table gewerke-list-table">
            <thead>
              <tr>
                <SortTh label="Gewerk" column="name" sorting={sorting} />
                <SortTh label="Status" column="status" sorting={sorting} />
                <SortTh label="Einheiten" column="einheiten" sorting={sorting} firstDir="desc" />
                <SortTh label="Geplant" column="geplant" sorting={sorting} firstDir="desc" className="text-right" />
                <SortTh label="Bezahlt" column="bezahlt" sorting={sorting} firstDir="desc" className="text-right" />
                <SortTh label="Angebote" column="angebote" sorting={sorting} firstDir="desc" className="text-right" />
                <th aria-label="Aktionen"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((g) => {
                const stats = model.gewerk(g.id);
                const assignedUnits = einheiten.filter((eh) => stats.einheitIds.includes(eh.id));
                return (
                  <tr
                    key={g.id}
                    className={`${selectedId === g.id ? 'gewerke-list-row--active ' : ''}${draggedId === g.id ? 'gewerke-list-row--dragging ' : ''}${dragOverId === g.id && draggedId && draggedId !== g.id ? 'gewerke-list-row--drag-over' : ''}`}
                    onClick={() => actions.openGewerk(g.id)}
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
                      </div>
                    </td>
                    <td>
                      <div className="gewerke-list-tags">
                        <Badge status={g.status} small />
                        <GewerkPaymentBadge zahlstatus={stats.zahlstatus} small />
                      </div>
                    </td>
                    <td>
                      <div className="gewerke-list-units">
                        {assignedUnits.length > 0
                          ? assignedUnits.map((eh) => <span key={eh.id} className="einheit-tag einheit-tag--sm">{eh.name}</span>)
                          : <span className="gewerke-list-muted">Keine</span>}
                      </div>
                    </td>
                    <td className="text-right">{stats.geplant > 0 ? formatCurrency(stats.geplant) : '—'}</td>
                    <td className="text-right">{stats.bezahlt > 0 ? formatCurrency(stats.bezahlt) : '—'}</td>
                    <td className="text-right">{stats.anzahlAngebote}</td>
                    <td>
                      <button className="btn-icon btn-icon--danger" title="Löschen" onClick={(e) => { e.stopPropagation(); onDelete(g.id); }}>
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
