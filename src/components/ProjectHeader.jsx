import VersionBadge from './VersionBadge';

export default function ProjectHeader({ projekt, onEdit }) {
  return (
    <div className="project-header">
      <div className="project-header-info">
        <div>
          <h1 className="project-name">{projekt.name}</h1>
          {projekt.adresse && <p className="project-address">{projekt.adresse}</p>}
        </div>
        <div className="project-header-actions">
          <VersionBadge />
          <button className="btn btn-ghost" onClick={onEdit}>✏ Bearbeiten</button>
        </div>
      </div>
    </div>
  );
}
