export const ORGANIZE_SCALE = 900;

export function applyOrganizeDelta(current, deltaY, scale = ORGANIZE_SCALE) {
  return Math.min(1, Math.max(0, current + deltaY / scale));
}

export function isArchiveFiled(organize, reduceMotion = false) {
  return Boolean(reduceMotion) || Number(organize) >= 1;
}

/** Scroller alias — Explore treats organize >= 1 (or reduced motion) as filed. */
export const isFiled = isArchiveFiled;

const WAYPOINT_SLOP = 40;

/**
 * Filing follows how far the scroller has travelled from intro (0) to
 * archive (1). Past the archive — including the map — stays fully filed.
 */
export function organizeFromScroll(scrollTop, archiveTop) {
  const top = Number(archiveTop);
  if (!Number.isFinite(top) || top <= 0) return 1;
  return Math.min(1, Math.max(0, Number(scrollTop) / top));
}

export function waypointFromScroll({ scrollTop, archiveTop, mapTop }) {
  if (mapTop != null && scrollTop >= mapTop - WAYPOINT_SLOP) return "map";
  if (archiveTop != null && scrollTop >= archiveTop - WAYPOINT_SLOP) {
    return "archive";
  }
  return "intro";
}
