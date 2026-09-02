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

/** How long after an upward flick from the map we keep parking on #archive. */
export const FROM_MAP_LOCK_MS = 520;

export function isPastArchive(scrollTop, mapTop, slop = 12) {
  if (mapTop == null) return false;
  return Number(scrollTop) >= Number(mapTop) - slop;
}

/**
 * Up from the map — or while the post-map latch is still held — must park
 * on the filed archive. Do not start unfiling in the same gesture.
 */
export function shouldParkOnArchive({
  deltaY,
  onMap,
  fromMapLock,
  organize,
}) {
  if (Number(deltaY) >= 0) return false;
  if (onMap) return true;
  return Boolean(fromMapLock) && Number(organize) >= 1;
}

/** Second, separate upward gesture on the archive unfiles toward the intro. */
export function shouldUnfileTowardIntro({
  deltaY,
  onMap,
  fromMapLock,
  organize,
}) {
  return (
    Number(organize) >= 1 &&
    Number(deltaY) < 0 &&
    !onMap &&
    !fromMapLock
  );
}
