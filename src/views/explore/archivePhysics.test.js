import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FILED_THRESHOLD,
  ORGANIZE_SCALE,
  applyOrganizeDelta,
  isArchiveFiled,
  isFiled,
  organizeFromScroll,
  waypointFromScroll,
} from "./archivePhysics.js";

test("applyOrganizeDelta clamps between 0 and 1", () => {
  assert.equal(applyOrganizeDelta(0, -120), 0);
  assert.equal(applyOrganizeDelta(1, 120), 1);
  assert.equal(applyOrganizeDelta(0.5, 0), 0.5);
});

test("applyOrganizeDelta advances organize on downward wheel", () => {
  const next = applyOrganizeDelta(0, ORGANIZE_SCALE / 2);
  assert.equal(next, 0.5);
  assert.equal(applyOrganizeDelta(0.9, ORGANIZE_SCALE), 1);
});

test("isFiled / isArchiveFiled treat reduced motion as already filed", () => {
  assert.equal(isArchiveFiled(0), false);
  assert.equal(isArchiveFiled(0.91), false);
  assert.equal(isArchiveFiled(FILED_THRESHOLD), true);
  assert.equal(isArchiveFiled(0.92), true);
  assert.equal(isArchiveFiled(1), true);
  assert.equal(isArchiveFiled(0, true), true);
  assert.equal(isFiled(1), true);
  assert.equal(isFiled, isArchiveFiled);
});

test("organizeFromScroll files in proportion between intro and archive", () => {
  assert.equal(organizeFromScroll(0, 800), 0);
  assert.equal(organizeFromScroll(400, 800), 0.5);
  assert.equal(organizeFromScroll(736, 800), 1);
  assert.equal(organizeFromScroll(800, 800), 1);
  assert.equal(organizeFromScroll(1600, 800), 1);
  assert.equal(organizeFromScroll(100, 0), 1);
});

test("waypointFromScroll is geometric: intro, archive, then map", () => {
  assert.equal(
    waypointFromScroll({
      scrollTop: 0,
      archiveTop: 800,
      mapTop: 1600,
    }),
    "intro",
  );
  assert.equal(
    waypointFromScroll({
      scrollTop: 820,
      archiveTop: 800,
      mapTop: 1600,
    }),
    "archive",
  );
  assert.equal(
    waypointFromScroll({
      scrollTop: 1580,
      archiveTop: 800,
      mapTop: 1600,
    }),
    "map",
  );
});
