import { useState } from 'react';

// Sorting for clickable table headers. A sort is { key, dir } or null
// (null = the list's own order, e.g. the drag & drop order of the trades).

export function compareValues(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''), 'de', { sensitivity: 'base', numeric: true });
}

/** Stable sort; `accessors` maps a sort key to a function returning the value. */
export function sortBy(items, sort, accessors) {
  const accessor = sort && accessors[sort.key];
  if (!accessor) return items;
  const factor = sort.dir === 'desc' ? -1 : 1;
  return items
    .map((item, index) => [item, index])
    .sort(([a, ia], [b, ib]) => factor * compareValues(accessor(a), accessor(b)) || ia - ib)
    .map(([item]) => item);
}

/**
 * First click sorts by the column (amounts start with the largest), the second
 * click reverses, the third returns to the default order.
 */
export function nextSort(current, key, firstDir, defaultSort) {
  if (!current || current.key !== key) return { key, dir: firstDir };
  if (current.dir === firstDir) return { key, dir: firstDir === 'asc' ? 'desc' : 'asc' };
  return defaultSort;
}

export function useSort(defaultSort = null) {
  const [sort, setSort] = useState(defaultSort);
  return {
    sort,
    toggle: (key, firstDir = 'asc') => setSort((cur) => nextSort(cur, key, firstDir, defaultSort)),
    reset: () => setSort(defaultSort),
  };
}
