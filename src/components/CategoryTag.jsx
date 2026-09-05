import { colorForKey } from '../utils/colors';

/**
 * Colored pill showing a Gewerk category (Kategorie). Uses a deterministic
 * color per category name so the same category always looks the same,
 * making it easy to spot which Gewerk/category something belongs to at a
 * glance across the whole app.
 */
export default function CategoryTag({ kategorie, small }) {
  if (!kategorie) return null;
  const color = colorForKey(kategorie);
  return (
    <span
      className={`category-tag${small ? ' category-tag--sm' : ''}`}
      style={{ color }}
    >
      <span className="category-tag-dot" style={{ background: color }} aria-hidden="true" />
      {kategorie}
    </span>
  );
}
