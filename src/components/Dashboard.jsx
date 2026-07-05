import { useMemo } from 'react';
import { calcGesamtStats } from '../utils/calculations';
import { formatCurrency, formatDate, daysUntil, isOverdue } from '../utils/dateUtils';
import Badge from './Badge';

function KpiCard({ label, value, sub, warn }) {
  return (
    <div className={`kpi-card${warn ? ' kpi-card--warn' : ''}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard({ projekt, gewerke, angebote, meilensteine, onNavigate }) {
  const stats = useMemo(() => calcGesamtStats(angebote), [angebote]);

  const offeneAngebote = angebote.filter((a) => a.status === 'offen').length;
  const gewerkCount = gewerke.length;
  const overdueGewerke = gewerke.filter((g) => isOverdue(g.geplantesEnde, g.status));

  const upcomingMeilensteine = useMemo(() => {
    return meilensteine
      .filter((m) => m.status !== 'erledigt')
      .map((m) => ({ ...m, days: daysUntil(m.datum) }))
      .filter((m) => m.days !== null && m.days <= 60)
      .sort((a, b) => a.days - b.days)
      .slice(0, 5);
  }, [meilensteine]);

  const gewerkeByStatus = useMemo(() => {
    const map = {};
    gewerke.forEach((g) => {
      map[g.status] = (map[g.status] || 0) + 1;
    });
    return map;
  }, [gewerke]);

  return (
    <div className="dashboard">
      <h2 className="section-title">Dashboard</h2>

      <div className="kpi-grid">
        <KpiCard
          label="Gewerke gesamt"
          value={gewerkCount}
          sub={`${gewerkeByStatus['fertig'] || 0} fertig · ${gewerkeByStatus['in Arbeit'] || 0} in Arbeit`}
        />
        <KpiCard
          label="Offene Angebote"
          value={offeneAngebote}
          sub="Noch nicht entschieden"
        />
        <KpiCard
          label="Beauftragt"
          value={formatCurrency(stats.sumBeauftragt)}
          sub={projekt.budget > 0 ? `von ${formatCurrency(projekt.budget)} Budget` : undefined}
          warn={projekt.budget > 0 && stats.sumBeauftragt > projekt.budget}
        />
        <KpiCard
          label="Bezahlt"
          value={formatCurrency(stats.sumBezahlt)}
          sub={`Offen: ${formatCurrency(stats.sumOffen)}`}
        />
      </div>

      {overdueGewerke.length > 0 && (
        <div className="alert alert--warn">
          <strong>⚠ Verzögerte Gewerke:</strong>{' '}
          {overdueGewerke.map((g) => g.name).join(', ')} — Enddatum überschritten!
        </div>
      )}

      <div className="dashboard-bottom">
        <div className="dashboard-section">
          <h3 className="subsection-title">Nächste Termine & Meilensteine</h3>
          {upcomingMeilensteine.length === 0 ? (
            <p className="empty-state">Keine bevorstehenden Termine.</p>
          ) : (
            <ul className="milestone-list">
              {upcomingMeilensteine.map((m) => {
                const gewerk = m.gewerkId
                  ? gewerke.find((g) => g.id === m.gewerkId)
                  : null;
                const overdue = m.days < 0;
                return (
                  <li key={m.id} className={`milestone-item${overdue ? ' milestone-item--overdue' : ''}`}>
                    <div className="milestone-dot" />
                    <div className="milestone-content">
                      <span className="milestone-title">{m.titel}</span>
                      {gewerk && <span className="milestone-gewerk">{gewerk.name}</span>}
                    </div>
                    <span className={`milestone-date${overdue ? ' milestone-date--overdue' : ''}`}>
                      {overdue ? `${Math.abs(m.days)} Tage überfällig` : m.days === 0 ? 'Heute' : `in ${m.days} Tagen`}
                      <br />
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatDate(m.datum)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="dashboard-section">
          <h3 className="subsection-title">Gewerke-Übersicht</h3>
          <div className="gewerk-overview-list">
            {gewerke.length === 0 ? (
              <p className="empty-state">Keine Gewerke angelegt.</p>
            ) : (
              gewerke.map((g) => {
                const gwAngebote = angebote.filter((a) => a.gewerkId === g.id);
                const ausgewaehlt = gwAngebote.find((a) => a.status === 'ausgewählt');
                const overdue = isOverdue(g.geplantesEnde, g.status);
                return (
                  <div
                    key={g.id}
                    className={`gewerk-overview-item${overdue ? ' gewerk-overview-item--overdue' : ''}`}
                    onClick={() => onNavigate('gewerke', g.id)}
                  >
                    <div className="gewerk-overview-main">
                      <span className="gewerk-overview-name">{g.name}</span>
                      <span className="gewerk-overview-kat">{g.kategorie}</span>
                    </div>
                    <div className="gewerk-overview-right">
                      <Badge status={g.status} small />
                      {ausgewaehlt && (
                        <span className="gewerk-overview-amount">
                          {formatCurrency(ausgewaehlt.betragBeauftragt)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
