import assert from "node:assert/strict";
import test from "node:test";
import {
  TOOLTIP_GAP,
  tooltipAnchorAboveDot,
} from "./mapInteraction.js";

test("tooltipAnchorAboveDot centers the tip above the dot", () => {
  const pos = tooltipAnchorAboveDot({
    dot: { left: 100, top: 200, width: 20, height: 20 },
    tipWidth: 80,
    tipHeight: 40,
    gap: 8,
    pad: 12,
    viewport: { width: 800, height: 600 },
  });
  assert.equal(pos.x, 100 + 20 / 2 - 80 / 2);
  assert.equal(pos.y, 200 - 40 - 8);
});

test("tooltipAnchorAboveDot uses the shared gap by default", () => {
  const pos = tooltipAnchorAboveDot({
    dot: { left: 200, top: 180, width: 12, height: 12 },
    tipWidth: 100,
    tipHeight: 50,
    viewport: { width: 800, height: 600 },
  });
  assert.equal(pos.x, 200 + 12 / 2 - 100 / 2);
  assert.equal(pos.y, 180 - 50 - TOOLTIP_GAP);
});

test("tooltipAnchorAboveDot stays above the dot on mobile when there is no room", () => {
  const pos = tooltipAnchorAboveDot({
    dot: { left: 120, top: 36, width: 16, height: 16 },
    tipWidth: 80,
    tipHeight: 48,
    gap: 8,
    pad: 12,
    viewport: { width: 800, height: 600 },
    allowShift: false,
  });
  assert.equal(pos.y, 12);
  assert.ok(pos.y < 36, "mobile peek stays above the dot instead of flipping below");
});

test("tooltipAnchorAboveDot may shift below on desktop if the top would clip", () => {
  const pos = tooltipAnchorAboveDot({
    dot: { left: 120, top: 36, width: 16, height: 16 },
    tipWidth: 80,
    tipHeight: 48,
    gap: 8,
    pad: 12,
    viewport: { width: 800, height: 600 },
    allowShift: true,
  });
  assert.equal(pos.y, 36 + 16 + 8);
});

test("tooltipAnchorAboveDot clamps horizontally to the viewport", () => {
  const pos = tooltipAnchorAboveDot({
    dot: { left: 4, top: 200, width: 10, height: 10 },
    tipWidth: 80,
    tipHeight: 40,
    gap: 8,
    pad: 12,
    viewport: { width: 200, height: 600 },
  });
  assert.equal(pos.x, 12);
});
