export const ORGANIZE_SCALE = 900;

/**
 * CSS snap can land on `#archive` a few pixels early, so organize never quite
 * reaches 1 on the downward intro → folders pass. Treat anything at or above
 * this fraction as fully filed so grouping radios replace the intro chrome.
 */
export const FILED_THRESHOLD = 0.92;

export function easeInOut(t) {
  const x = Math.min(1, Math.max(0, Number(t) || 0));
  return x < 0.5 ? 2 * x * x : -1 + (4 - 2 * x) * x;
}

function unitRange(value, start, span) {
  if (!(span > 0)) return value >= start ? 1 : 0;
  return Math.min(1, Math.max(0, (Number(value) - start) / span));
}

/**
 * Staged intro → folders motion. One ease per phase so we do not double-ease
 * scroll progress (that made the middle of the pass rush).
 *
 * stand: reports flip from table stacks to upright in place
 * travel: upright reports slide into folder slots
 * folders: magazine files slide in from just off-stage
 * cam: camera rides the whole pass
 */
export function filingPhases(organize) {
  const t = Math.min(1, Math.max(0, Number(organize) || 0));
  return {
    cam: easeInOut(t),
    stand: easeInOut(unitRange(t, 0.04, 0.36)),
    travel: easeInOut(unitRange(t, 0.32, 0.58)),
    folders: easeInOut(unitRange(t, 0.4, 0.5)),
  };
}

/**
 * Mandatory snap on `#intro` / `#archive` jumps organize 0 → 1 in one tick.
 * Keep snap off from the intro until the folders are filed.
 */
export function isFilingScroll(organize, reduceMotion = false) {
  if (reduceMotion) return false;
  const t = Number(organize);
  if (!Number.isFinite(t)) return false;
  return t < FILED_THRESHOLD;
}

export function applyOrganizeDelta(current, deltaY, scale = ORGANIZE_SCALE) {
  return Math.min(1, Math.max(0, current + deltaY / scale));
}

export function isArchiveFiled(organize, reduceMotion = false) {
  return Boolean(reduceMotion) || Number(organize) >= FILED_THRESHOLD;
}

/** Scroller alias — Explore treats organize >= FILED_THRESHOLD (or reduced motion) as filed. */
export const isFiled = isArchiveFiled;

const WAYPOINT_SLOP = 40;

/**
 * Filing follows how far the scroller has travelled from intro (0) to
 * archive (1). Past the archive — including the map — stays fully filed.
 */
export function organizeFromScroll(scrollTop, archiveTop) {
  const top = Number(archiveTop);
  if (!Number.isFinite(top) || top <= 0) return 1;
  const progress = Math.min(1, Math.max(0, Number(scrollTop) / top));
  return progress >= FILED_THRESHOLD ? 1 : progress;
}

export function waypointFromScroll({ scrollTop, archiveTop, mapTop }) {
  if (mapTop != null && scrollTop >= mapTop - WAYPOINT_SLOP) return "map";
  if (archiveTop != null && scrollTop >= archiveTop - WAYPOINT_SLOP) {
    return "archive";
  }
  return "intro";
}
