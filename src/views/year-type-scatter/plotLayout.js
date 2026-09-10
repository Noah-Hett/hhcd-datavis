export const Y_COL = 168;
/** Narrower Y labels on thin viewports so every type sits on two lines. */
export const Y_COL_NARROW = 122;
export const Y_COL_NARROW_MAX = 799;
export const LEFT = 20;
export const RIGHT = 40;
export const TOP = 28;
export const BOTTOM = 28;
export const PX_PER_YEAR = 48;
export const MIN_INNER_FLOOR = 692;

export function yColumnWidth(viewportWidth) {
  return viewportWidth <= Y_COL_NARROW_MAX ? Y_COL_NARROW : Y_COL;
}

/** Two-line split for the narrow Y column: at " / ", otherwise at the last space. */
export function yLabelLines(label) {
  const slash = label.indexOf(" / ");
  if (slash >= 0) {
    return [label.slice(0, slash + 2), label.slice(slash + 3)];
  }
  const space = label.lastIndexOf(" ");
  if (space >= 0) {
    return [label.slice(0, space), label.slice(space + 1)];
  }
  return [label];
}

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
