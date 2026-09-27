import VersionBadge from './VersionBadge';

export default function ProjectHeader({ projekt, onEdit }) {
  return (
    <div className="project-header">
      <div className="project-header-text">
        <h1 className="project-name" title={projekt.name}>{projekt.name}</h1>
        {projekt.adresse && <p className="project-address">{projekt.adresse}</p>}
      </div>
      <div className="project-header-actions">
        <VersionBadge />
        <button className="btn btn-ghost" onClick={onEdit} aria-label="Projekt bearbeiten" title="Projekt bearbeiten">
          <span aria-hidden="true">✏</span>
          <span className="btn-label">Bearbeiten</span>
        </button>
      </div>
    </div>
  );
}
