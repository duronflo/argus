import { useState } from 'react';
import Modal from './Modal';
import { BUILD, CHANGELOG, VERSION } from '../version';

function formatDatum(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function VersionBadge() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="version-badge"
        onClick={() => setOpen(true)}
        title={BUILD ? `Build ${BUILD} – Versionshistorie anzeigen` : 'Versionshistorie anzeigen'}
      >
        v{VERSION}
      </button>

      {open && (
        <Modal title="Versionshistorie" onClose={() => setOpen(false)} width={480}>
          <p className="version-current">
            Installiert: <strong>v{VERSION}</strong>
            {BUILD && <span className="version-build"> · Build {BUILD}</span>}
          </p>
          <ol className="changelog">
            {CHANGELOG.map((entry) => (
              <li key={entry.version} className="changelog-entry">
                <div className="changelog-head">
                  <span className="changelog-version">v{entry.version}</span>
                  <span className="changelog-title">{entry.titel}</span>
                  <span className="changelog-date">{formatDatum(entry.datum)}</span>
                </div>
                <ul className="changelog-points">
                  {entry.punkte.map((punkt) => <li key={punkt}>{punkt}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </Modal>
      )}
    </>
  );
}
