import { useMemo, useState } from 'react';
import Badge from './Badge';
import { formatCurrency, formatDate } from '../utils/dateUtils';
import { calcGesamtStats } from '../utils/calculations';

export default function AngeboteView({ gewerke, angebote, onNavigate }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const stats = useMemo(() => calcGesamtStats(angebote), [angebote]);

  const filtered = useMemo(() => {
    return angebote.filter((a) => {
      const gewerk = gewerke.find((g) => g.id === a.gewerkId);
      const matchSearch =
        a.anbieter.toLowerCase().includes(search.toLowerCase()) ||
        (a.titel || '').toLowerCase().includes(search.toLowerCase()) ||
        (gewerk?.name || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus ? a.status === filterStatus : true;
      return matchSearch && matchStatus;
    });
  }, [angebote, gewerke, search, filterStatus]);

  // Group by gewerk
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((a) => {
      const key = a.gewerkId || '__none__';
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return Object.entries(map);
  }, [filtered]);

  return (
    <div className="angebote-view">
      <h2 className="section-title">Angebote</h2>

      <div className="stats-row">
        <div className="stat-chip">
          <span className="stat-chip-label">Summe Angebote</span>
          <span className="stat-chip-value">{formatCurrency(stats.sumAngebote)}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-label">Beauftragt</span>
          <span className="stat-chip-value">{formatCurrency(stats.sumBeauftragt)}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-label">Bezahlt</span>
          <span className="stat-chip-value">{formatCurrency(stats.sumBezahlt)}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-label">Offen</span>
          <span className="stat-chip-value">{formatCurrency(stats.sumOffen)}</span>
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
      </div>

      {grouped.length === 0 ? (
        <p className="empty-state">Keine Angebote gefunden.</p>
      ) : (
        grouped.map(([gewerkId, items]) => {
          const gewerk = gewerke.find((g) => g.id === gewerkId);
          return (
            <div key={gewerkId} className="angebote-group">
              <div
                className="angebote-group-header"
                onClick={() => gewerk && onNavigate('gewerke', gewerk.id)}
                style={{ cursor: gewerk ? 'pointer' : undefined }}
              >
                <span className="angebote-group-name">{gewerk ? gewerk.name : 'Unbekanntes Gewerk'}</span>
                {gewerk && <Badge status={gewerk.status} small />}
                {gewerk && <span className="angebote-group-nav">→ Details</span>}
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Anbieter</th>
                      <th>Titel</th>
                      <th className="text-right">Angebot</th>
                      <th className="text-right">Beauftragt</th>
                      <th className="text-right">Bezahlt</th>
                      <th>Datum</th>
                      <th>Gültig bis</th>
                      <th>Status</th>
                      <th>Notiz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((a) => (
                      <tr key={a.id} className={a.status === 'ausgewählt' ? 'row--selected' : a.status === 'abgelehnt' ? 'row--rejected' : ''}>
                        <td><strong>{a.anbieter}</strong></td>
                        <td>{a.titel || '—'}</td>
                        <td className="text-right">{formatCurrency(a.betragAngebot)}</td>
                        <td className="text-right">{a.betragBeauftragt > 0 ? formatCurrency(a.betragBeauftragt) : '—'}</td>
                        <td className={`text-right${a.bezahlt > a.betragBeauftragt && a.betragBeauftragt > 0 ? ' warn-text' : ''}`}>
                          {a.bezahlt > 0 ? formatCurrency(a.bezahlt) : '—'}
                        </td>
                        <td>{formatDate(a.datum)}</td>
                        <td>{formatDate(a.gueltigBis)}</td>
                        <td><Badge status={a.status} small /></td>
                        <td className="note-cell">{a.notiz || '—'}</td>
                      </tr>
                    ))}
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
