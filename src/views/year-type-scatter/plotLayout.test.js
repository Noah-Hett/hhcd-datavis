import assert from "node:assert/strict";
import test from "node:test";
import {
  LEFT,
  RIGHT,
  Y_COL,
  Y_COL_NARROW,
  Y_COL_NARROW_MAX,
  minInnerWidth,
  plotLayout,
  yColumnWidth,
  yLabelLines,
} from "./plotLayout.js";

const YEAR_MIN = 2000;
const YEAR_MAX = 2017;

test("minInnerWidth uses the year span floor for 2000–2017", () => {
  const floor = minInnerWidth(YEAR_MIN, YEAR_MAX);
  assert.ok(floor >= 692);
  assert.equal(floor, Math.max(692, (YEAR_MAX - YEAR_MIN + 1.2) * 48));
});

test("wide pane fits exactly and is not scrollable", () => {
  const floor = minInnerWidth(YEAR_MIN, YEAR_MAX);
  const viewportWidth = LEFT + floor + RIGHT + 120;
  const layout = plotLayout(viewportWidth, 500, YEAR_MIN, YEAR_MAX);
  assert.equal(layout.scrollable, false);
  assert.equal(layout.plotWidth, viewportWidth);
  assert.equal(layout.innerWidth, viewportWidth - LEFT - RIGHT);
});

test("pane exactly at the year-axis minimum fits without scroll", () => {
  const floor = minInnerWidth(YEAR_MIN, YEAR_MAX);
  const viewportWidth = LEFT + floor + RIGHT;
  const layout = plotLayout(viewportWidth, 400, YEAR_MIN, YEAR_MAX);
  assert.equal(layout.scrollable, false);
  assert.equal(layout.plotWidth, viewportWidth);
});

test("narrow pane keeps the min width and is scrollable", () => {
  const floor = minInnerWidth(YEAR_MIN, YEAR_MAX);
  const viewportWidth = LEFT + floor + RIGHT - 80;
  const layout = plotLayout(viewportWidth, 400, YEAR_MIN, YEAR_MAX);
  assert.equal(layout.scrollable, true);
  assert.equal(layout.innerWidth, floor);
  assert.equal(layout.plotWidth, LEFT + floor + RIGHT);
  assert.ok(layout.plotWidth > viewportWidth + 1);
});

test("y column stays wide on desktop and narrows on thin viewports", () => {
  assert.equal(yColumnWidth(Y_COL_NARROW_MAX + 1), Y_COL);
  assert.equal(yColumnWidth(Y_COL_NARROW_MAX), Y_COL_NARROW);
  assert.equal(yColumnWidth(390), Y_COL_NARROW);
  assert.ok(Y_COL_NARROW < Y_COL);
  assert.equal(Y_COL_NARROW, 122);
});

test("narrow Y labels split to two lines at a slash or last space", () => {
  assert.deepEqual(yLabelLines("Design guidelines / Policy guidelines"), [
    "Design guidelines /",
    "Policy guidelines",
  ]);
  assert.deepEqual(yLabelLines("Physical prototypes"), [
    "Physical",
    "prototypes",
  ]);
  assert.deepEqual(yLabelLines("Conceptual framework"), [
    "Conceptual",
    "framework",
  ]);
  assert.deepEqual(yLabelLines("Products / Media campaign"), [
    "Products /",
    "Media campaign",
  ]);
  assert.deepEqual(yLabelLines("Business model / Design concepts"), [
    "Business model /",
    "Design concepts",
  ]);
});
