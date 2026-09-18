/**
 * Pure selection state calculations for lists, tables, and grids.
 * Independent of React lifecycle for maximum testability and reuse.
 */

/**
 * Computes contiguous range selection between an anchor index and target index.
 */
export function computeRangeSelection(visibleIds, anchorIndex, targetIndex) {
  if (!Array.isArray(visibleIds) || visibleIds.length === 0) return [];
  const start = anchorIndex >= 0 ? anchorIndex : 0;
  const min = Math.max(0, Math.min(start, targetIndex));
  const max = Math.min(visibleIds.length - 1, Math.max(start, targetIndex));

  return visibleIds.slice(min, max + 1);
}

/**
 * Toggles an ID in a selection array.
 */
export function toggleItemSelection(currentSelectedIds, id) {
  if (!Array.isArray(currentSelectedIds)) return [id];
  const exists = currentSelectedIds.includes(id);
  return exists ? currentSelectedIds.filter((item) => item !== id) : [...currentSelectedIds, id];
}

/**
 * Adds a range of IDs to current selection without duplicates.
 */
export function mergeRangeSelection(currentSelectedIds, newRangeIds) {
  return Array.from(new Set([...(currentSelectedIds || []), ...(newRangeIds || [])]));
}

/**
 * Selects all visible IDs.
 */
export function selectAllVisible(visibleIds) {
  return Array.from(new Set(visibleIds || []));
}

/**
 * Deselects all visible IDs while keeping any other selections intact.
 */
export function deselectVisible(currentSelectedIds, visibleIds) {
  const visibleSet = new Set(visibleIds || []);
  return (currentSelectedIds || []).filter((id) => !visibleSet.has(id));
}
