import { useMemo, useState } from 'react';
import { formatCurrency, generateId } from '../utils/dateUtils';
import Badge from './Badge';
import Modal from './Modal';

const RECHNUNG_STATUSES = ['offen', 'bezahlt'];

function RechnungForm({ initial, gewerke, fixedGewerkId, onSave, onCancel }) {
  const [form, setForm] = useState({
    gewerkId: fixedGewerkId || '',
    anbieter: '',
    titel: '',
    betrag: '',
    status: 'offen',
    notiz: '',
    ...initial,
    gewerkId: initial?.gewerkId || fixedGewerkId || '',
  });

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.gewerkId) return;
    onSave({
      ...form,
      betrag: parseFloat(form.betrag) || 0,
    });
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {!fixedGewerkId && (
        <div className="form-row">
          <label className="form-label">Gewerk *</label>
          <select className="select" required value={form.gewerkId} onChange={(e) => set('gewerkId', e.target.value)}>
            <option value="">Bitte wählen…</option>
            {gewerke.map((gewerk) => (
              <option key={gewerk.id} value={gewerk.id}>{gewerk.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="form-row">
        <label className="form-label">Lieferant / Anbieter *</label>
        <input className="input" required value={form.anbieter} onChange={(e) => set('anbieter', e.target.value)} />
      </div>
      <div className="form-row">
        <label className="form-label">Titel</label>
        <input className="input" value={form.titel} onChange={(e) => set('titel', e.target.value)} />
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label className="form-label">Betrag (€)</label>
          <input className="input" type="number" step="0.01" min="0" value={form.betrag} onChange={(e) => set('betrag', e.target.value)} />
        </div>
        <div className="form-row">
          <label className="form-label">Status</label>
          <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>
            {RECHNUNG_STATUSES.map((status) => (
              <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row">
        <label className="form-label">Notiz</label>
        <textarea className="input textarea" rows={3} value={form.notiz} onChange={(e) => set('notiz', e.target.value)} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn-primary">Speichern</button>
      </div>
    </form>
  );
}

function sumBezahlt(rechnung) {
  return rechnung.status === 'bezahlt' ? (rechnung.betrag || 0) : 0;
}

function RechnungenTable({
  title,
  description,
  gewerke,
  rechnungen,
  fixedGewerkId,
  emptyMessage,
  onNavigate,
  onAddRechnung,
  onEditRechnung,
  onDeleteRechnung,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editRechnung, setEditRechnung] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOrder, setSortOrder] = useState(fixedGewerkId ? 'anbieter-asc' : 'gewerk-asc');

  const scopedRechnungen = useMemo(
    () => (fixedGewerkId ? rechnungen.filter((rechnung) => rechnung.gewerkId === fixedGewerkId) : rechnungen),
    [fixedGewerkId, rechnungen],
  );

  const filteredRechnungen = useMemo(() => {
    return scopedRechnungen.filter((rechnung) => {
      const gewerk = gewerke.find((item) => item.id === rechnung.gewerkId);
      const query = search.toLowerCase();
      const matchSearch = !query || [
        rechnung.anbieter,
        rechnung.titel,
        rechnung.notiz,
        gewerk?.name,
      ].some((value) => (value || '').toLowerCase().includes(query));
      const matchStatus = filterStatus ? rechnung.status === filterStatus : true;
      return matchSearch && matchStatus;
    });
  }, [filterStatus, gewerke, scopedRechnungen, search]);

  const sortedRechnungen = useMemo(() => {
    return [...filteredRechnungen].sort((a, b) => {
      const direction = sortOrder.endsWith('-desc') ? -1 : 1;
      if (sortOrder.startsWith('amount-')) return direction * ((a.betrag || 0) - (b.betrag || 0));
      if (sortOrder.startsWith('status-')) return direction * (a.status || '').localeCompare(b.status || '', 'de', { sensitivity: 'base' });
      if (sortOrder.startsWith('title-')) return direction * (a.titel || '').localeCompare(b.titel || '', 'de', { sensitivity: 'base' });
      if (sortOrder.startsWith('gewerk-')) {
        const nameA = gewerke.find((item) => item.id === a.gewerkId)?.name || '';
        const nameB = gewerke.find((item) => item.id === b.gewerkId)?.name || '';
        return direction * nameA.localeCompare(nameB, 'de', { sensitivity: 'base' });
      }
      return direction * (a.anbieter || '').localeCompare(b.anbieter || '', 'de', { sensitivity: 'base' });
    });
  }, [filteredRechnungen, gewerke, sortOrder]);

  const sumBetrag = scopedRechnungen.reduce((sum, rechnung) => sum + (rechnung.betrag || 0), 0);
  const sumBezahltBetrag = scopedRechnungen.reduce((sum, rechnung) => sum + sumBezahlt(rechnung), 0);
  const canCreate = fixedGewerkId || gewerke.length > 0;

  return (
    <div className="offer-table-wrap">
      <div className="trade-detail-section-header">
        <div>
          <h3 className="subsection-title">{title}</h3>
          {description && <p className="form-hint">{description}</p>}
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setEditRechnung(null); setShowForm(true); }}
          disabled={!canCreate}
          title={canCreate ? undefined : 'Bitte zuerst ein Gewerk anlegen.'}
        >
          + Rechnung
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-chip">
          <span className="stat-chip-label">Rechnungen</span>
          <span className="stat-chip-value">{scopedRechnungen.length}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-label">Betrag</span>
          <span className="stat-chip-value">{formatCurrency(sumBetrag)}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-label">Bezahlt</span>
          <span className="stat-chip-value">{formatCurrency(sumBezahltBetrag)}</span>
        </div>
      </div>

      <div className="trade-list-filters">
        <input
          className="input"
          placeholder="Suche nach Lieferant, Titel, Notiz oder Gewerk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Alle Status</option>
          <option value="offen">Offen</option>
          <option value="bezahlt">Bezahlt</option>
        </select>
        <select className="select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} aria-label="Rechnungen sortieren">
          {!fixedGewerkId && (
            <>
              <option value="gewerk-asc">Gewerk (A–Z)</option>
              <option value="gewerk-desc">Gewerk (Z–A)</option>
            </>
          )}
          <option value="anbieter-asc">Lieferant (A–Z)</option>
          <option value="anbieter-desc">Lieferant (Z–A)</option>
          <option value="title-asc">Titel (A–Z)</option>
          <option value="title-desc">Titel (Z–A)</option>
          <option value="amount-asc">Betrag (aufsteigend)</option>
          <option value="amount-desc">Betrag (absteigend)</option>
          <option value="status-asc">Status (A–Z)</option>
          <option value="status-desc">Status (Z–A)</option>
        </select>
      </div>

      {sortedRechnungen.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {!fixedGewerkId && <th>Gewerk</th>}
                <th>Lieferant</th>
                <th>Titel</th>
                <th className="text-right">Betrag</th>
                <th className="text-right">Bezahlt</th>
                <th>Status</th>
                <th>Notiz</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedRechnungen.map((rechnung) => {
                const gewerk = gewerke.find((item) => item.id === rechnung.gewerkId);
                return (
                  <tr key={rechnung.id}>
                    {!fixedGewerkId && (
                      <td>
                        {gewerk && onNavigate ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => onNavigate('gewerke', gewerk.id)}
                          >
                            {gewerk.name}
                          </button>
                        ) : (
                          gewerk?.name || '—'
                        )}
                      </td>
                    )}
                    <td><strong>{rechnung.anbieter}</strong></td>
                    <td>{rechnung.titel || '—'}</td>
                    <td className="text-right">{formatCurrency(rechnung.betrag || 0)}</td>
                    <td className="text-right">{formatCurrency(sumBezahlt(rechnung))}</td>
                    <td><Badge status={rechnung.status} small /></td>
                    <td className="note-cell">{rechnung.notiz || '—'}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon" title="Bearbeiten" onClick={() => { setEditRechnung(rechnung); setShowForm(true); }}>✏</button>
                        <button className="btn-icon btn-icon--danger" title="Löschen" onClick={() => setDeleteConfirm(rechnung.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal
          title={editRechnung ? 'Rechnung bearbeiten' : 'Neue Rechnung'}
          onClose={() => setShowForm(false)}
        >
          <RechnungForm
            initial={editRechnung}
            gewerke={gewerke}
            fixedGewerkId={fixedGewerkId}
            onSave={(data) => {
              if (editRechnung) {
                onEditRechnung({ ...editRechnung, ...data });
              } else {
                onAddRechnung({ ...data, id: generateId('rgd') });
              }
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Rechnung löschen?" onClose={() => setDeleteConfirm(null)} width={380}>
          <p>Soll diese Rechnung wirklich gelöscht werden?</p>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Abbrechen</button>
            <button className="btn btn-danger" onClick={() => { onDeleteRechnung(deleteConfirm); setDeleteConfirm(null); }}>Löschen</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function RechnungenSection(props) {
  return (
    <RechnungenTable
      {...props}
      title="Direkte Rechnungen"
      description="Material- oder Lieferantenrechnungen ohne eigenes Angebot direkt am Gewerk erfassen."
      emptyMessage="Noch keine direkten Rechnungen erfasst."
    />
  );
}

export default function RechnungenView(props) {
  return (
    <div className="angebote-view">
      <h2 className="section-title">Rechnungen</h2>
      <RechnungenTable
        {...props}
        title="Direkte Rechnungen"
        description="Eigenständige Rechnungen können unabhängig von Angeboten direkt einem Gewerk zugeordnet werden."
        emptyMessage="Noch keine direkten Rechnungen erfasst."
      />
    </div>
  );
}
