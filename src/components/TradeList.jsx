import { useState } from 'react';
import Badge from './Badge';
import { isOverdue } from '../utils/dateUtils';

const GEWERK_STATUSES = ['offen', 'angefragt', 'angeboten', 'beauftragt', 'in Arbeit', 'fertig'];

export default function TradeList({
  gewerke,
  angebote,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
}) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = gewerke.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.kategorie.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? g.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

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
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Alle Status</option>
          {GEWERK_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>
      {filtered.length === 0 ? (
        <p className="empty-state">Keine Gewerke gefunden.</p>
      ) : (
        <ul className="trade-items">
          {filtered.map((g) => {
            const gwAngebote = angebote.filter((a) => a.gewerkId === g.id);
            const overdue = isOverdue(g.geplantesEnde, g.status);
            return (
              <li
                key={g.id}
                className={`trade-item${selectedId === g.id ? ' trade-item--active' : ''}${overdue ? ' trade-item--overdue' : ''}`}
                onClick={() => onSelect(g.id)}
              >
                <div className="trade-item-main">
                  <span className="trade-item-name">{g.name}</span>
                  <span className="trade-item-kat">{g.kategorie}</span>
                </div>
                <div className="trade-item-right">
                  <Badge status={g.status} small />
                  <span className="trade-item-count">{gwAngebote.length} Ang.</span>
                  <button
                    className="btn-icon btn-icon--danger"
                    title="Löschen"
                    onClick={(e) => { e.stopPropagation(); onDelete(g.id); }}
                  >
                    🗑
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
