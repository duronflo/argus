import Badge, { GewerkPaymentBadge } from './Badge';
import CategoryTag from './CategoryTag';
import OfferTable from './OfferTable';
import GewerkForm from './GewerkForm';
import PieChart from './PieChart';
import { RechnungenTable } from './RechnungenView';
import { formatCurrency } from '../utils/dateUtils';
import { colorForKey, getGewerkBarColor } from '../utils/colors';
import { getEinheitIds } from '../domain/model';
import { equalSplit } from '../domain/migrate';
import { useProject } from '../state/ProjectContext';

function sameKeys(a = {}, b = {}) {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => k in b);
}

function EinheitAnteileEditor({ gewerk, einheiten, stats, onUpdate }) {
  const ids = getEinheitIds(gewerk);
  const anteile = gewerk.einheitAnteile || {};
  const assignedEinheiten = einheiten.filter((eh) => ids.includes(eh.id));

  function handleSliderChange(id, val) {
    const newVal = Math.max(0, Math.min(100, Number(val)));
    const rest = ids.filter((x) => x !== id);
    const oldSum = rest.reduce((s, x) => s + (anteile[x] || 0), 0);
    const newSum = 100 - newVal;
    const newAnteile = { ...anteile, [id]: newVal };
    if (oldSum > 0) {
      rest.forEach((x, i) => {
        const share = i === rest.length - 1
          ? newSum - rest.slice(0, -1).reduce((s, y) => s + newAnteile[y], 0)
          : Math.round(((anteile[x] || 0) / oldSum) * newSum);
        newAnteile[x] = Math.max(0, share);
      });
    } else if (rest.length > 0) {
      const perItem = Math.round(newSum / rest.length);
      rest.forEach((x, i) => {
        newAnteile[x] = i === rest.length - 1 ? newSum - perItem * (rest.length - 1) : perItem;
      });
    }
    onUpdate({ ...gewerk, einheitAnteile: newAnteile });
  }

  function handleTextChange(id, raw) {
    const val = parseInt(raw, 10);
    if (!isNaN(val)) handleSliderChange(id, val);
  }

  const total = ids.reduce((s, id) => s + (anteile[id] || 0), 0);
  const pieSegments = assignedEinheiten.map((eh) => ({
    label: eh.name,
    value: stats.proEinheit[eh.id]?.geplant || 0,
    color: colorForKey(eh.id),
  }));

  return (
    <div className="anteile-editor">
      <div className="anteile-header">
        <span className="meta-label">Kostenverteilung auf Einheiten</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onUpdate({ ...gewerk, einheitAnteile: equalSplit(ids) })}>
          ⟳ Gleich verteilen
        </button>
      </div>
      <div className="anteile-body">
        <div className="anteile-sliders">
          {assignedEinheiten.map((eh) => {
            const val = anteile[eh.id] ?? 0;
            return (
              <div key={eh.id} className="anteile-row">
                <span className="anteile-name">{eh.name}</span>
                <input type="range" className="anteile-slider" min={0} max={100} value={val} onChange={(e) => handleSliderChange(eh.id, e.target.value)} />
                <input type="number" className="input anteile-input" min={0} max={100} value={val} onChange={(e) => handleTextChange(eh.id, e.target.value)} />
                <span className="anteile-pct">%</span>
              </div>
            );
          })}
          {total !== 100 && <p className="anteile-warn">Summe: {total}% (sollte 100% ergeben)</p>}
          <p className="form-hint">Gilt für das Budget und für Rechnungen ohne eigene Einheit.</p>
        </div>
        {assignedEinheiten.length > 1 && (
          <div className="anteile-pie">
            <PieChart segments={pieSegments} size={110} emptyText="Kein geplantes Budget vorhanden." />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TradeDetail({ gewerkId }) {
  const { data, model, actions } = useProject();
  const gewerk = data.gewerke.find((g) => g.id === gewerkId);
  if (!gewerk) return null;

  const stats = model.gewerk(gewerk.id);
  const einheiten = data.einheiten;
  const assignedEinheiten = einheiten.filter((eh) => stats.einheitIds.includes(eh.id));
  const kats = data.kategorien?.length > 0 ? data.kategorien : ['Sonstiges'];
  const rechnungen = data.rechnungen.filter((r) => r.gewerkId === gewerk.id);
  const pct = stats.geplant > 0 ? Math.min((stats.bezahlt / stats.geplant) * 100, 100) : 0;
  const over = stats.budget > 0 && stats.bezahlt > stats.budget;
  const saveGewerk = (updated) => actions.save('gewerke', updated);

  return (
    <div className="trade-detail">
      {/* The dialog title already shows the name – only tags and status here */}
      <div className="trade-detail-header">
        <div className="trade-detail-tags">
          <CategoryTag kategorie={gewerk.kategorie} />
          {assignedEinheiten.map((eh) => <span key={eh.id} className="einheit-tag">{eh.name}</span>)}
        </div>
        <div className="trade-detail-actions">
          <Badge status={gewerk.status} />
          <GewerkPaymentBadge zahlstatus={stats.zahlstatus} />
        </div>
      </div>

      <div className="trade-detail-meta">
        <div className="einheit-card-stats">
          <div className="einheit-stat">
            <span className="einheit-stat-label">{stats.abgerechnet ? 'Geplant (= Rechnungen)' : 'Geplant'}</span>
            <span className="einheit-stat-value">{stats.geplant > 0 ? formatCurrency(stats.geplant) : '—'}</span>
          </div>
          {stats.abgerechnet && (
            <div className="einheit-stat trade-detail-original-budget">
              <span className="einheit-stat-label">Ursprüngliches Budget</span>
              <span className="einheit-stat-value">{formatCurrency(stats.budget)}</span>
            </div>
          )}
          <div className="einheit-stat">
            <span className="einheit-stat-label">Bezahlt</span>
            <span className={`einheit-stat-value${over ? ' warn-text' : ''}`}>{formatCurrency(stats.bezahlt)}</span>
          </div>
          <div className="einheit-stat">
            <span className="einheit-stat-label">Offen</span>
            <span className="einheit-stat-value">{formatCurrency(stats.offen)}</span>
          </div>
        </div>
        {stats.geplant > 0 && (
          <div className="budget-bar" style={{ marginTop: 8 }}>
            <div className="budget-bar-fill" style={{ width: `${pct}%`, background: getGewerkBarColor(gewerk.status, stats.zahlstatus) }} />
          </div>
        )}
      </div>

      <section className="trade-detail-editor">
        <div className="trade-detail-section-header">
          <div>
            <h3 className="section-title">Gewerk bearbeiten</h3>
            <p className="form-hint">Felder direkt ändern – die Änderungen werden automatisch übernommen.</p>
          </div>
        </div>
        <GewerkForm
          key={gewerk.id}
          initial={gewerk}
          einheiten={einheiten}
          kategorien={kats}
          autoSave
          onSave={(formData) => saveGewerk({
            ...gewerk,
            ...formData,
            // The form only knows which units are assigned; keep the current
            // shares from the slider editor unless that set changed.
            einheitAnteile: sameKeys(formData.einheitAnteile, gewerk.einheitAnteile) ? gewerk.einheitAnteile : formData.einheitAnteile,
          })}
        />
      </section>

      {assignedEinheiten.length > 0 && (
        <EinheitAnteileEditor gewerk={gewerk} einheiten={einheiten} stats={stats} onUpdate={saveGewerk} />
      )}

      <div className="offer-table-wrap">
        <RechnungenTable rechnungen={rechnungen} fixedGewerkId={gewerk.id} />
      </div>

      <OfferTable gewerkId={gewerk.id} />
    </div>
  );
}
