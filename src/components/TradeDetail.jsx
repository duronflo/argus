import { useState } from 'react';
import Badge from './Badge';
import CategoryTag from './CategoryTag';
import OfferTable from './OfferTable';
import Modal from './Modal';
import GewerkForm from './GewerkForm';
import PieChart from './PieChart';
import { formatCurrency } from '../utils/dateUtils';
import { colorForKey, getGewerkBarColor } from '../utils/colors';
import { calcEinheitGewerkStats, getEffektivesGewerkBudget, sumGewerkBezahlt } from '../utils/calculations';

function EinheitAnteileEditor({ gewerk, einheiten, angebote, onUpdate }) {
  const ids = gewerk.einheitIds || [];
  const anteile = gewerk.einheitAnteile || {};

  if (ids.length === 0) return null;

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
        newAnteile[x] = i === rest.length - 1
          ? newSum - perItem * (rest.length - 1)
          : perItem;
      });
    }
    onUpdate({ ...gewerk, einheitAnteile: newAnteile });
  }

  function handleTextChange(id, raw) {
    const val = parseInt(raw, 10);
    if (!isNaN(val)) handleSliderChange(id, val);
  }

  function resetEqual() {
    const pct = Math.round(100 / ids.length);
    const newAnteile = {};
    ids.forEach((id, i) => {
      newAnteile[id] = i === ids.length - 1 ? 100 - pct * (ids.length - 1) : pct;
    });
    onUpdate({ ...gewerk, einheitAnteile: newAnteile });
  }

  const total = ids.reduce((s, id) => s + (anteile[id] || 0), 0);
  const pieSegments = assignedEinheiten.map((eh) => ({
    label: eh.name,
    value: calcEinheitGewerkStats(eh.id, gewerk, angebote).sumGeplant,
    color: colorForKey(eh.id),
  }));

  return (
    <div className="anteile-editor">
      <div className="anteile-header">
        <span className="meta-label">Kostenverteilung auf Einheiten</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={resetEqual}>⟳ Gleich verteilen</button>
      </div>
      <div className="anteile-body">
        <div className="anteile-sliders">
          {assignedEinheiten.map((eh) => {
            const val = anteile[eh.id] ?? 0;
            return (
              <div key={eh.id} className="anteile-row">
                <span className="anteile-name">{eh.name}</span>
                <input
                  type="range"
                  className="anteile-slider"
                  min={0}
                  max={100}
                  value={val}
                  onChange={(e) => handleSliderChange(eh.id, e.target.value)}
                />
                <input
                  type="number"
                  className="input anteile-input"
                  min={0}
                  max={100}
                  value={val}
                  onChange={(e) => handleTextChange(eh.id, e.target.value)}
                />
                <span className="anteile-pct">%</span>
              </div>
            );
          })}
          {total !== 100 && (
            <p className="anteile-warn">Summe: {total}% (sollte 100% ergeben)</p>
          )}
        </div>
        {assignedEinheiten.length > 1 && (
          <div className="anteile-pie">
            <PieChart
              segments={pieSegments}
              size={110}
              emptyText="Kein geplantes Budget vorhanden."
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TradeDetail({
  gewerk,
  angebote,
  einheiten,
  kategorien,
  onEditGewerk,
  onAddAngebot,
  onEditAngebot,
  onDeleteAngebot,
}) {
  const [showEditForm, setShowEditForm] = useState(false);

  const assignedEinheiten = einheiten
    ? einheiten.filter((eh) => (gewerk.einheitIds || []).includes(eh.id))
    : [];

  const kats = (kategorien && kategorien.length > 0) ? kategorien : ['Sonstiges'];

  const bezahlt = sumGewerkBezahlt(gewerk, angebote);
  const originalGeplant = gewerk.geplantBudget || 0;
  const geplant = getEffektivesGewerkBudget(gewerk, angebote);
  const offen = Math.max(geplant - bezahlt, 0);
  const pct = geplant > 0 ? Math.min((bezahlt / geplant) * 100, 100) : 0;
  const over = originalGeplant > 0 && bezahlt > originalGeplant;

  return (
    <div className="trade-detail">
      <div className="trade-detail-header">
        <div>
          <h2 className="trade-detail-title">{gewerk.name}</h2>
          <div className="trade-detail-tags">
            <CategoryTag kategorie={gewerk.kategorie} />
            {assignedEinheiten.map((eh) => (
              <span key={eh.id} className="einheit-tag">{eh.name}</span>
            ))}
          </div>
        </div>
        <div className="trade-detail-actions">
          <Badge status={gewerk.status} />
          <button className="btn btn-ghost btn-sm" onClick={() => setShowEditForm(true)}>✏ Bearbeiten</button>
        </div>
      </div>

      <div className="trade-detail-meta">
        <div className="einheit-card-stats">
          <div className="einheit-stat">
            <span className="einheit-stat-label">Geplantes Budget</span>
            <span className="einheit-stat-value">{geplant > 0 ? formatCurrency(geplant) : '—'}</span>
          </div>
          <div className="einheit-stat">
            <span className="einheit-stat-label">Bezahlt</span>
            <span className={`einheit-stat-value${over ? ' warn-text' : ''}`}>{formatCurrency(bezahlt)}</span>
          </div>
          <div className="einheit-stat">
            <span className="einheit-stat-label">Offen</span>
            <span className="einheit-stat-value">{formatCurrency(offen)}</span>
          </div>
        </div>
        {geplant > 0 && (
          <div className="budget-bar" style={{ marginTop: 8 }}>
            <div
              className="budget-bar-fill"
              style={{ width: `${pct}%`, background: getGewerkBarColor(gewerk.status) }}
            />
          </div>
        )}
        {gewerk.notizen && (
          <div className="meta-notes">
            <span className="meta-label">Notizen</span>
            <p className="meta-notes-text">{gewerk.notizen}</p>
          </div>
        )}
      </div>

      {assignedEinheiten.length > 0 && (
        <EinheitAnteileEditor
          gewerk={gewerk}
          einheiten={einheiten}
          angebote={angebote}
          onUpdate={onEditGewerk}
        />
      )}

      <OfferTable
        angebote={angebote}
        onAddAngebot={onAddAngebot}
        onEditAngebot={onEditAngebot}
        onDeleteAngebot={onDeleteAngebot}
      />

      {showEditForm && (
        <Modal title="Gewerk bearbeiten" onClose={() => setShowEditForm(false)}>
          <GewerkForm
            initial={gewerk}
            einheiten={einheiten}
            kategorien={kats}
            onSave={(data) => {
              onEditGewerk({ ...gewerk, ...data });
              setShowEditForm(false);
            }}
            onCancel={() => setShowEditForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
