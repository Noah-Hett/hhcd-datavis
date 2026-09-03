import assert from "node:assert/strict";
import { test } from "node:test";
import { modeFromLocation } from "./modeFromLocation.js";

test("modeFromLocation maps search to simple", () => {
  assert.equal(modeFromLocation("/search", ""), "simple");
  assert.equal(modeFromLocation("/search", "#archive"), "simple");
});

test("modeFromLocation maps archive hash to folders", () => {
  assert.equal(modeFromLocation("/", "#archive"), "folders");
  assert.equal(modeFromLocation("/", "archive"), "folders");
});

test("modeFromLocation maps map hash to map", () => {
  assert.equal(modeFromLocation("/", "#map"), "map");
});

test("modeFromLocation treats intro and empty Explore hash as home", () => {
  assert.equal(modeFromLocation("/", ""), "home");
  assert.equal(modeFromLocation("/", "#"), "home");
  assert.equal(modeFromLocation("/", "#intro"), "home");
  assert.equal(modeFromLocation("/", "intro"), "home");
});
