import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ORGANIZE_SCALE,
  applyOrganizeDelta,
  isArchiveFiled,
  isFiled,
  isPastArchive,
  shouldParkOnArchive,
  shouldUnfileTowardIntro,
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
  assert.equal(isArchiveFiled(0.99), false);
  assert.equal(isArchiveFiled(1), true);
  assert.equal(isArchiveFiled(0, true), true);
  assert.equal(isFiled(1), true);
  assert.equal(isFiled, isArchiveFiled);
});

test("waypointFromScroll prefers map, then filed archive, then intro", () => {
  assert.equal(
    waypointFromScroll({
      scrollTop: 0,
      archiveTop: 800,
      mapTop: 1600,
      filed: false,
    }),
    "intro",
  );
  assert.equal(
    waypointFromScroll({
      scrollTop: 0,
      archiveTop: 800,
      mapTop: 1600,
      filed: true,
    }),
    "archive",
  );
  assert.equal(
    waypointFromScroll({
      scrollTop: 820,
      archiveTop: 800,
      mapTop: 1600,
      filed: false,
    }),
    "archive",
  );
  assert.equal(
    waypointFromScroll({
      scrollTop: 1580,
      archiveTop: 800,
      mapTop: 1600,
      filed: true,
    }),
    "map",
  );
});

test("isPastArchive is true once scroll reaches the map", () => {
  assert.equal(isPastArchive(1588, 1600), true);
  assert.equal(isPastArchive(1570, 1600), false);
  assert.equal(isPastArchive(0, null), false);
});

test("upward wheel from the map parks on archive instead of unfiling", () => {
  const fromMap = {
    deltaY: -80,
    onMap: true,
    fromMapLock: false,
    organize: 1,
  };
  assert.equal(shouldParkOnArchive(fromMap), true);
  assert.equal(shouldUnfileTowardIntro(fromMap), false);
});

test("trackpad inertia after leaving the map still parks while latched", () => {
  const latched = {
    deltaY: -40,
    onMap: false,
    fromMapLock: true,
    organize: 1,
  };
  assert.equal(shouldParkOnArchive(latched), true);
  assert.equal(shouldUnfileTowardIntro(latched), false);
});

test("a later upward gesture on the archive unfiles toward intro", () => {
  const settled = {
    deltaY: -80,
    onMap: false,
    fromMapLock: false,
    organize: 1,
  };
  assert.equal(shouldParkOnArchive(settled), false);
  assert.equal(shouldUnfileTowardIntro(settled), true);
});

test("downward wheel never parks or unfiles", () => {
  const down = {
    deltaY: 80,
    onMap: true,
    fromMapLock: true,
    organize: 1,
  };
  assert.equal(shouldParkOnArchive(down), false);
  assert.equal(shouldUnfileTowardIntro(down), false);
});
