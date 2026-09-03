export const Y_COL = 168;
export const LEFT = 20;
export const RIGHT = 40;
export const TOP = 28;
export const BOTTOM = 28;
export const PX_PER_YEAR = 48;
export const MIN_INNER_FLOOR = 692;

/** Minimum inner plot width so year spacing stays readable when scrolling. */
export function minInnerWidth(yearMin, yearMax) {
  const slots = Math.max(yearMax - yearMin, 1) + 1.2;
  return Math.max(MIN_INNER_FLOOR, slots * PX_PER_YEAR);
}

/**
 * Size the scatter plot to the scroll pane.
 * Wide pane (viewport >= natural min): exact fit, not scrollable.
 * Narrow pane: keep min year spacing and allow horizontal scroll.
 */
export function plotLayout(viewportWidth, height, yearMin, yearMax) {
  const availableInner = Math.max(viewportWidth - LEFT - RIGHT, 1);
  const floor = minInnerWidth(yearMin, yearMax);
  const scrollable = availableInner + 1 < floor;
  // When fitting, pin plotWidth to the measured pane so subpixels cannot
  // leave a 1px overflow that paints a horizontal scrollbar.
  const innerWidth = scrollable ? floor : availableInner;
  const plotWidth = scrollable
    ? LEFT + innerWidth + RIGHT
    : Math.max(viewportWidth, LEFT + availableInner + RIGHT);
  const innerHeight = Math.max(height - TOP - BOTTOM, 1);
  return {
    height,
    left: LEFT,
    right: RIGHT,
    top: TOP,
    bottom: BOTTOM,
    innerWidth,
    innerHeight,
    plotWidth,
    originY: height - BOTTOM,
    arrowRight: plotWidth - 10,
    scrollable,
  };
}
