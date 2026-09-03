export const ORGANIZE_SCALE = 900;

/**
 * CSS snap can land on `#archive` a few pixels early, so organize never quite
 * reaches 1 on the downward intro → folders pass. Treat anything at or above
 * this fraction as fully filed so grouping radios replace the intro chrome.
 */
export const FILED_THRESHOLD = 0.92;

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

/** Empty or unknown Explore hashes map to the intro pile. */
export function normalizeExploreHash(hash) {
  const id = String(hash || "").replace(/^#/, "");
  if (id === "archive" || id === "map" || id === "intro") return id;
  return "intro";
}

/** True when scroll-driven waypoint should replace the URL hash. */
export function hashNeedsReplace(currentHash, waypoint) {
  return normalizeExploreHash(currentHash) !== waypoint;
}

/**
 * `setSearchParams` / a search-only navigate leaves an empty hash. Treat that
 * as a strip when the scroller is already on archive or map, not as Home.
 */
export function hashWasStripped(hash, previousWaypoint) {
  const raw = String(hash || "").replace(/^#/, "");
  return !raw && previousWaypoint != null && previousWaypoint !== "intro";
}
