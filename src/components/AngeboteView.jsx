import { useMemo, useState } from 'react';
import Badge, { GewerkPaymentBadge } from './Badge';
import CategoryTag from './CategoryTag';
import SortTh from './SortHeader';
import { formatCurrency } from '../utils/dateUtils';
import { moveId } from '../utils/moveId';
import { sortBy, useSort } from '../utils/sort';
import { ANGEBOT_STATUSES } from '../domain/constants';
import { useProject } from '../state/ProjectContext';

export default function AngeboteView() {
  const { data, model, actions } = useProject();
  const { gewerke, angebote, einheiten } = data;
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEinheit, setFilterEinheit] = useState('');
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  // Groups follow the trade order (drag a group header to change it);
  // column headers sort the offers inside each group.
  const sorting = useSort(null);
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

  // Group by gewerk, in the trade order; offers of unknown trades come last.
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((a) => {
      const key = a.gewerkId || '__none__';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    });
    const orderedKeys = [...gewerke.map((g) => g.id).filter((id) => map.has(id)), ...[...map.keys()].filter((k) => !gewerke.some((g) => g.id === k))];
    return orderedKeys.map((k) => [k, sortBy(map.get(k), sorting.sort, {
      anbieter: (a) => a.anbieter,
      titel: (a) => a.titel,
      betrag: (a) => a.betragAngebot || 0,
      rechnungen: (a) => model.angebot(a.id).summeRechnungen,
      status: (a) => ANGEBOT_STATUSES.indexOf(a.status),
    })]);
  }, [filtered, gewerke, model, sorting.sort]);

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
        <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Nach Status filtern">
          <option value="">Alle Status</option>
          <option value="offen">Offen</option>
          <option value="ausgewählt">Ausgewählt</option>
          <option value="abgelehnt">Abgelehnt</option>
        </select>
        {einheiten && einheiten.length > 0 && (
          <select className="select" value={filterEinheit} onChange={(e) => setFilterEinheit(e.target.value)} aria-label="Nach Einheit filtern">
            <option value="">Alle Einheiten</option>
            {einheiten.map((eh) => (
              <option key={eh.id} value={eh.id}>{eh.name}</option>
            ))}
          </select>
        )}
      </div>

      <p className="form-hint trade-list-hint">
        Gruppen ziehen ändert die Reihenfolge der Gewerke. Klick auf eine Spaltenüberschrift sortiert die Angebote.
      </p>

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
                draggable={!!gewerk}
                onDragStart={(e) => { e.stopPropagation(); setDraggedId(gewerkId); }}
                onDragOver={(e) => { if (gewerk) { e.preventDefault(); setDragOverId(gewerkId); } }}
                onDragLeave={() => setDragOverId((cur) => (cur === gewerkId ? null : cur))}
                onDrop={(e) => { if (gewerk) { e.preventDefault(); e.stopPropagation(); handleDropOnGroup(gewerkId); } }}
                onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
              >
                {gewerk && <span className="drag-handle" title="Ziehen zum Sortieren">⠿</span>}
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
                <table className="table table--stack">
                  <thead>
                    <tr>
                      <SortTh label="Anbieter" column="anbieter" sorting={sorting} />
                      <SortTh label="Titel" column="titel" sorting={sorting} />
                      <SortTh label="Angebot" column="betrag" sorting={sorting} firstDir="desc" className="text-right" />
                      <SortTh label="Rechnungen" column="rechnungen" sorting={sorting} firstDir="desc" className="text-right" />
                      <SortTh label="Status" column="status" sorting={sorting} />
                      <th>Notiz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((a) => {
                      const aStats = model.angebot(a.id);
                      return (
                      <tr key={a.id} className={a.status === 'ausgewählt' ? 'row--selected' : a.status === 'abgelehnt' ? 'row--rejected' : ''}>
                        <td className="cell-title"><strong>{a.anbieter}</strong></td>
                        <td data-label="Titel">{a.titel || '—'}</td>
                        <td data-label="Angebot" className="text-right cell-amount">{formatCurrency(a.betragAngebot)}</td>
                        <td data-label="Rechnungen" className="text-right">
                          {aStats.anzahlRechnungen > 0 ? `${aStats.anzahlRechnungen} · ${formatCurrency(aStats.summeRechnungen)}` : '—'}
                        </td>
                        <td data-label="Status"><Badge status={a.status} small /></td>
                        <td data-label="Notiz" className="note-cell cell-wide">{a.notiz || '—'}</td>
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
