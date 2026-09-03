import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FILED_THRESHOLD,
  ORGANIZE_SCALE,
  applyOrganizeDelta,
  filingPhases,
  isArchiveFiled,
  isFiled,
  organizeFromScroll,
  stepVisualOrganize,
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

test("filingPhases stand before travel, folders last", () => {
  const rest = filingPhases(0);
  assert.equal(rest.stand, 0);
  assert.equal(rest.travel, 0);
  assert.equal(rest.folders, 0);
  assert.equal(rest.cam, 0);

  const early = filingPhases(0.2);
  assert.ok(early.stand > 0.3);
  assert.equal(early.travel, 0);
  assert.equal(early.folders, 0);

  const mid = filingPhases(0.5);
  assert.equal(mid.stand, 1);
  assert.ok(mid.travel > 0.05 && mid.travel < 0.95);
  assert.ok(mid.folders > 0);
  assert.ok(mid.folders < mid.travel + 0.2);

  const done = filingPhases(1);
  assert.equal(done.stand, 1);
  assert.equal(done.travel, 1);
  assert.equal(done.folders, 1);
  assert.equal(done.cam, 1);
});

test("stepVisualOrganize eases a snap jump and tracks a scrub", () => {
  let visual = 0;
  for (let i = 0; i < 8; i += 1) visual = stepVisualOrganize(visual, 1);
  assert.ok(visual > 0.3 && visual < 0.9);

  visual = 0;
  for (let i = 0; i < 90; i += 1) visual = stepVisualOrganize(visual, 1);
  assert.ok(visual > 0.99);

  assert.equal(stepVisualOrganize(0.5, 0.52), 0.5 + (0.52 - 0.5) * 0.5);
  assert.equal(stepVisualOrganize(0.2, 1, true), 1);
});
