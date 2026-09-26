import { useMemo, useState } from 'react';
import Badge, { GewerkPaymentBadge } from './Badge';
import CategoryTag from './CategoryTag';
import { formatCurrency } from '../utils/dateUtils';
import { moveId } from '../utils/moveId';
import { useProject } from '../state/ProjectContext';

export default function AngeboteView() {
  const { data, model, actions } = useProject();
  const { gewerke, angebote, einheiten } = data;
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEinheit, setFilterEinheit] = useState('');
  const [sortOrder, setSortOrder] = useState('custom');
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const isCustomOrder = sortOrder === 'custom';
  const stats = model.projekt;

  const filtered = useMemo(() => {
    return angebote.filter((a) => {
      const gewerk = gewerke.find((g) => g.id === a.gewerkId);
      const matchSearch =
        a.anbieter.toLowerCase().includes(search.toLowerCase()) ||
        (a.titel || '').toLowerCase().includes(search.toLowerCase()) ||
        (gewerk?.name || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus ? a.status === filterStatus : true;
      const matchEinheit = filterEinheit
        ? model.gewerk(gewerk?.id).einheitIds.includes(filterEinheit)
        : true;
      return matchSearch && matchStatus && matchEinheit;
    });
  }, [angebote, gewerke, model, search, filterStatus, filterEinheit]);

  // Group by gewerk
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((a) => {
      const key = a.gewerkId || '__none__';
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });

    if (isCustomOrder) {
      const orderedKeys = [...gewerke.map((g) => g.id), '__none__'];
      return orderedKeys.filter((k) => map[k]).map((k) => [k, map[k]]);
    }

    Object.values(map).forEach((items) => {
      items.sort((a, b) => {
        const direction = sortOrder.endsWith('-desc') ? -1 : 1;
        if (sortOrder.startsWith('amount-')) return direction * ((a.betragAngebot || 0) - (b.betragAngebot || 0));
        const field = sortOrder.startsWith('anbieter-') ? 'anbieter' : sortOrder.startsWith('title-') ? 'titel' : 'status';
        return direction * (a[field] || '').localeCompare(b[field] || '', 'de', { sensitivity: 'base' });
      });
    });

    const entries = Object.entries(map);
    if (sortOrder.startsWith('gewerk-')) {
      const direction = sortOrder.endsWith('-desc') ? -1 : 1;
      entries.sort(([keyA], [keyB]) => {
        const nameA = gewerke.find((g) => g.id === keyA)?.name || '';
        const nameB = gewerke.find((g) => g.id === keyB)?.name || '';
        return direction * nameA.localeCompare(nameB, 'de', { sensitivity: 'base' });
      });
    }
    return entries;
  }, [filtered, gewerke, sortOrder, isCustomOrder]);

  function handleDropOnGroup(targetGewerkId) {
    if (draggedId && targetGewerkId && draggedId !== targetGewerkId) {
      const fullIds = gewerke.map((g) => g.id);
      actions.reorderGewerke(moveId(fullIds, draggedId, targetGewerkId));
    }
    setDraggedId(null);
    setDragOverId(null);
  }

  return (
    <div className="angebote-view">
      <h2 className="section-title">Angebote</h2>

      <div className="stats-row">
        <div className="stat-chip">
          <span className="stat-chip-label">Summe Angebote</span>
          <span className="stat-chip-value">{formatCurrency(stats.summeAngebote)}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-label">Davon ausgewählt</span>
          <span className="stat-chip-value">{formatCurrency(stats.summeAusgewaehlt)}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-label">Offene Angebote</span>
          <span className="stat-chip-value">{stats.offeneAngebote}</span>
        </div>
      </div>

      <div className="trade-list-filters">
        <input
          className="input"
          placeholder="Suche nach Anbieter, Titel oder Gewerk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Alle Status</option>
          <option value="offen">Offen</option>
          <option value="ausgewählt">Ausgewählt</option>
          <option value="abgelehnt">Abgelehnt</option>
        </select>
        <select className="select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} aria-label="Angebote sortieren">
          <option value="custom">Eigene Reihenfolge (ziehen zum Sortieren)</option>
          <option value="gewerk-asc">Gewerk (A–Z)</option>
          <option value="gewerk-desc">Gewerk (Z–A)</option>
          <option value="anbieter-asc">Anbieter (A–Z)</option>
          <option value="anbieter-desc">Anbieter (Z–A)</option>
          <option value="title-asc">Titel (A–Z)</option>
          <option value="title-desc">Titel (Z–A)</option>
          <option value="amount-asc">Betrag (aufsteigend)</option>
          <option value="amount-desc">Betrag (absteigend)</option>
          <option value="status-asc">Status (A–Z)</option>
          <option value="status-desc">Status (Z–A)</option>
        </select>
        {einheiten && einheiten.length > 0 && (
          <select className="select" value={filterEinheit} onChange={(e) => setFilterEinheit(e.target.value)}>
            <option value="">Alle Einheiten</option>
            {einheiten.map((eh) => (
              <option key={eh.id} value={eh.id}>{eh.name}</option>
            ))}
          </select>
        )}
      </div>

      {grouped.length === 0 ? (
        <p className="empty-state">Keine Angebote gefunden.</p>
      ) : (
        grouped.map(([gewerkId, items]) => {
          const gewerk = gewerke.find((g) => g.id === gewerkId);
          const assignedUnits = einheiten && gewerk
            ? einheiten.filter((eh) => model.gewerk(gewerk.id).einheitIds.includes(eh.id))
            : [];
          const sumGroup = items.reduce((s, a) => s + (a.betragAngebot || 0), 0);
          return (
            <div
              key={gewerkId}
              className={`angebote-group${dragOverId === gewerkId && draggedId && draggedId !== gewerkId ? ' angebote-group--drag-over' : ''}`}
            >
              <div
                className="angebote-group-header"
                onClick={() => gewerk && actions.openGewerk(gewerk.id)}
                style={{ cursor: gewerk ? 'pointer' : undefined }}
                draggable={isCustomOrder && !!gewerk}
                onDragStart={(e) => { e.stopPropagation(); setDraggedId(gewerkId); }}
                onDragOver={(e) => { if (isCustomOrder && gewerk) { e.preventDefault(); setDragOverId(gewerkId); } }}
                onDragLeave={() => setDragOverId((cur) => (cur === gewerkId ? null : cur))}
                onDrop={(e) => { if (isCustomOrder && gewerk) { e.preventDefault(); e.stopPropagation(); handleDropOnGroup(gewerkId); } }}
                onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
              >
                {isCustomOrder && gewerk && <span className="drag-handle" title="Ziehen zum Sortieren">⠿</span>}
                <span className="angebote-group-name">{gewerk ? gewerk.name : 'Unbekanntes Gewerk'}</span>
                {gewerk && <CategoryTag kategorie={gewerk.kategorie} small />}
                {gewerk && <Badge status={gewerk.status} small />}
                {gewerk && (
                  <GewerkPaymentBadge zahlstatus={model.gewerk(gewerk.id).zahlstatus} small />
                )}
                {assignedUnits.map((eh) => (
                  <span key={eh.id} className="einheit-tag einheit-tag--sm">{eh.name}</span>
                ))}
                <span className="angebote-group-sum">{formatCurrency(sumGroup)}</span>
                {gewerk && <span className="angebote-group-nav">→ Details</span>}
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Anbieter</th>
                      <th>Titel</th>
                      <th className="text-right">Angebot</th>
                      <th className="text-right">Rechnungen</th>
                      <th>Status</th>
                      <th>Notiz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((a) => {
                      const aStats = model.angebot(a.id);
                      return (
                      <tr key={a.id} className={a.status === 'ausgewählt' ? 'row--selected' : a.status === 'abgelehnt' ? 'row--rejected' : ''}>
                        <td><strong>{a.anbieter}</strong></td>
                        <td>{a.titel || '—'}</td>
                        <td className="text-right">{formatCurrency(a.betragAngebot)}</td>
                        <td className="text-right">
                          {aStats.anzahlRechnungen > 0 ? `${aStats.anzahlRechnungen} · ${formatCurrency(aStats.summeRechnungen)}` : '—'}
                        </td>
                        <td><Badge status={a.status} small /></td>
                        <td className="note-cell">{a.notiz || '—'}</td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
