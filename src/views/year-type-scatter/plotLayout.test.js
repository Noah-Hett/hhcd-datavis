import assert from "node:assert/strict";
import test from "node:test";
import {
  LEFT,
  RIGHT,
  minInnerWidth,
  plotLayout,
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
