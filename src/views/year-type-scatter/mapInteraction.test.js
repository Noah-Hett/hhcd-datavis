import assert from "node:assert/strict";
import test from "node:test";
import {
  DOT_HOVER_PAD,
  TOOLTIP_GAP,
  dotIsDimmed,
  dotPaintOrder,
  nearestDotAt,
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

test("dotPaintOrder keeps the hovered dot last so it stacks above neighbours", () => {
  const clusters = [{ key: "a" }, { key: "b" }, { key: "c" }];
  assert.deepEqual(
    dotPaintOrder(clusters, "a", null).map((cluster) => cluster.key),
    ["b", "c", "a"],
  );
  assert.equal(dotPaintOrder(clusters, null, null), clusters);
  assert.deepEqual(
    dotPaintOrder(clusters, "b", "c").map((cluster) => cluster.key),
    ["a", "c", "b"],
  );
});

test("dotIsDimmed greys every mark except the hovered or selected report", () => {
  assert.equal(
    dotIsDimmed({ clusterKey: "a", hoveredKey: null, selectedKey: null }),
    false,
  );
  assert.equal(
    dotIsDimmed({ clusterKey: "a", hoveredKey: "a", selectedKey: null }),
    false,
  );
  assert.equal(
    dotIsDimmed({ clusterKey: "b", hoveredKey: "a", selectedKey: null }),
    true,
  );
  assert.equal(
    dotIsDimmed({ clusterKey: "b", hoveredKey: null, selectedKey: "a" }),
    true,
  );
  assert.equal(
    dotIsDimmed({ clusterKey: "a", hoveredKey: "b", selectedKey: "a" }),
    false,
  );
});

test("nearestDotAt picks the closest centre when hover zones overlap", () => {
  const a = { key: "a", x: 0, y: 0, r: 10, cluster: { key: "a" } };
  const b = { key: "b", x: 22, y: 0, r: 10, cluster: { key: "b" } };
  const points = [a, b];
  assert.equal(nearestDotAt(points, 0, 0).key, "a");
  assert.equal(nearestDotAt(points, 22, 0).key, "b");
  assert.equal(nearestDotAt(points, 8, 0).key, "a");
  assert.equal(nearestDotAt(points, 14, 0).key, "b");
  assert.equal(nearestDotAt(points, 11, 0).key, "a");
  assert.equal(nearestDotAt(points, 100, 0), null);
  assert.ok(DOT_HOVER_PAD >= 11);
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
