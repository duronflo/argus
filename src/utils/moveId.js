/** Moves draggedId in front of targetId (drag & drop reordering). */
export function moveId(ids, draggedId, targetId) {
  const arr = [...ids];
  const from = arr.indexOf(draggedId);
  if (from === -1 || draggedId === targetId) return arr;
  arr.splice(from, 1);
  const to = arr.indexOf(targetId);
  arr.splice(to === -1 ? arr.length : to, 0, draggedId);
  return arr;
}
