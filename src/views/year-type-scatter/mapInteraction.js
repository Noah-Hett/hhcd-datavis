export const TOOLTIP_GAP = 10;
export const TOOLTIP_PAD = 12;
export const TOOLTIP_WIDTH = 340;
export const TOOLTIP_ESTIMATED_HEIGHT = 148;

export function shouldPeekFirst({
  keyboard,
  coarsePointer,
  lastTapKey,
  clusterKey,
}) {
  if (keyboard) return false;
  if (!coarsePointer) return false;
  return lastTapKey !== clusterKey;
}

export function tooltipAnchorAboveDot({
  dot,
  tipWidth,
  tipHeight,
  gap = TOOLTIP_GAP,
  pad = TOOLTIP_PAD,
  viewport,
  allowShift = false,
}) {
  const width = Math.max(0, tipWidth);
  const height = Math.max(0, tipHeight);
  let x = dot.left + dot.width / 2 - width / 2;
  let y = dot.top - height - gap;

  const maxX = viewport.width - width - pad;
  x = maxX < pad ? pad : Math.min(Math.max(pad, x), maxX);

  if (y < pad) {
    if (allowShift) {
      const below = dot.top + (dot.height ?? 0) + gap;
      if (below + height <= viewport.height - pad) {
        y = below;
      } else {
        y = pad;
      }
    } else {
      y = Math.max(y, pad);
    }
  }

  return { x, y };
}

export function contrastRatio(hexA, hexB) {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const [lr, lg, lb] = [r, g, b].map(srgbChannel);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function hexToRgb(hex) {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : raw;
  const value = Number.parseInt(full, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function srgbChannel(value) {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}
