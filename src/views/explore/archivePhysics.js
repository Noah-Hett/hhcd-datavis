export const ORGANIZE_SCALE = 900;

export function applyOrganizeDelta(current, deltaY, scale = ORGANIZE_SCALE) {
  return Math.min(1, Math.max(0, current + deltaY / scale));
}

export function isArchiveFiled(organize, reduceMotion = false) {
  return Boolean(reduceMotion) || Number(organize) >= 1;
}

/** Scroller alias — Explore treats organize >= 1 (or reduced motion) as filed. */
export const isFiled = isArchiveFiled;

export function waypointFromScroll({
  scrollTop,
  archiveTop,
  mapTop,
  filed,
}) {
  if (mapTop != null && scrollTop >= mapTop - 40) return "map";
  if (filed || (archiveTop != null && scrollTop >= archiveTop - 40)) {
    return "archive";
  }
  return "intro";
}
