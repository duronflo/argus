/** Clickable sort label; arrows show the active column and direction. */
export function SortButton({ label, column, sorting, firstDir = 'asc' }) {
  const active = sorting.sort?.key === column;
  const arrow = active ? (sorting.sort.dir === 'asc' ? '▲' : '▼') : '↕';
  return (
    <button
      type="button"
      className={`th-sort${active ? ' th-sort--active' : ''}`}
      onClick={() => sorting.toggle(column, firstDir)}
      title={`Nach „${label}“ sortieren`}
    >
      {label}
      <span className="th-sort-arrow" aria-hidden="true">{arrow}</span>
    </button>
  );
}

/** Table header cell that sorts the table when clicked (see utils/sort.js). */
export default function SortTh({ className, ...props }) {
  const active = props.sorting.sort?.key === props.column;
  const ariaSort = active ? (props.sorting.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
  return (
    <th className={className} aria-sort={ariaSort}>
      <SortButton {...props} />
    </th>
  );
}
