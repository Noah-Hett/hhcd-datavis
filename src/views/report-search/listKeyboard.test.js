import assert from "node:assert/strict";
import test from "node:test";
import { stepActive } from "./listKeyboard.js";

test("arrow keys walk a report list without wrapping", () => {
  assert.equal(stepActive(0, "ArrowDown", 5), 1);
  assert.equal(stepActive(4, "ArrowDown", 5), 4);
  assert.equal(stepActive(2, "ArrowUp", 5), 1);
  assert.equal(stepActive(0, "ArrowUp", 5), 0);
});

test("Home and End jump the list ends", () => {
  assert.equal(stepActive(3, "Home", 8), 0);
  assert.equal(stepActive(3, "End", 8), 7);
  assert.equal(stepActive(0, "End", 0), 0);
});
