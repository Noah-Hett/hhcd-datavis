import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ARCHIVE_ROWS,
  CAROUSEL_FACE_YAW,
  CAROUSEL_FEATURED_SCALE,
  CAROUSEL_FORWARD,
  CAROUSEL_RADIUS,
  CAROUSEL_RECEDE,
  CAROUSEL_YAW_CAP,
  FOLDER_D,
  PEEK_REST,
  PEEK_SELECT,
  carouselAnnouncement,
  carouselOrigin,
  carouselSignedOffset,
  carouselVisibleRadius,
  computeArchiveLayout,
  computeCarouselPose,
  computeLayout,
  reportHitAllowed,
  selectPeekSlot,
  shortestAngleDelta,
  stepCarouselIndex,
} from "./geometry.js";

function fakeReports(n) {
  return Array.from({ length: n }, (_, i) => ({
    reportNo: i + 1,
    title: `Report ${i + 1}`,
  }));
}

function fakeFolders(sizes) {
  return sizes.map((count, index) => ({
    id: `folder-${index}`,
    label: `Folder ${index}`,
    count,
    reports: fakeReports(count),
  }));
}

test("PEEK_REST shows a couple more files at rest", () => {
  assert.equal(PEEK_REST, 6);
  assert.ok(PEEK_SELECT >= PEEK_REST);
});

test("computeLayout peeks six at rest and every report on select", () => {
  const folders = fakeFolders([12]);
  const layout = computeLayout(folders);
  const poses = Object.values(layout.reportPos);
  assert.equal(poses.length, 12);
  assert.equal(poses.filter((pose) => pose.visibleAtRest).length, 6);
  assert.equal(
    poses.filter((pose) => pose.visibleOnSelect).length,
    12,
  );
  assert.ok(poses.every((pose) => pose.visibleOnSelect === true));
});

test("selected fan is wider than the rest peek so titles can sit apart", () => {
  const folders = fakeFolders([14]);
  const layout = computeLayout(folders);
  const poses = Object.values(layout.reportPos);
  const restXs = poses.filter((pose) => pose.visibleAtRest).map((pose) => pose.x);
  const selectXs = poses.map((pose) => pose.selectX);
  const restSpan = Math.max(...restXs) - Math.min(...restXs);
  const selectSpan = Math.max(...selectXs) - Math.min(...selectXs);
  assert.ok(selectSpan > restSpan * 1.6);
  assert.ok(selectPeekSlot(14) > selectPeekSlot(4));
});

test("computeArchiveLayout fans 64 reports into a curved three-row pile", () => {
  const list = fakeReports(64);
  const layout = computeArchiveLayout(list);
  assert.equal(Object.keys(layout.reportPos).length, 64);
  assert.equal(layout.rows, ARCHIVE_ROWS);

  const zs = Object.values(layout.reportPos).map((pose) => pose.z);
  const depth = Math.max(...zs) - Math.min(...zs);
  assert.ok(depth > 0.9, "pile should have real depth, not a barcode wobble");

  const rows = new Set(Object.values(layout.reportPos).map((pose) => pose.row));
  assert.deepEqual([...rows].sort(), [0, 1, 2]);

  const back = Object.values(layout.reportPos).filter((pose) => pose.row === 0);
  const midZ = back.reduce((sum, pose) => sum + pose.z, 0) / back.length;
  const endZ = Math.max(
    ...back.filter((pose) => pose.col === 0 || pose.col === back.length - 1).map((pose) => pose.z),
  );
  assert.ok(endZ > midZ, "each row should arc so the ends come forward");

  const yaws = new Set(
    Object.values(layout.reportPos).map((pose) => pose.ry.toFixed(3)),
  );
  assert.ok(yaws.size > 8, "yaw should fan across the arc, not a single angle");
});

test("computeArchiveLayout keeps every report pickable with a unique slot", () => {
  const list = fakeReports(64);
  const layout = computeArchiveLayout(list);
  const keys = list.map((report) => report.reportNo);
  assert.ok(keys.every((id) => layout.reportPos[id]));
  const slots = new Set(
    Object.values(layout.reportPos).map((pose) => `${pose.row}:${pose.col}`),
  );
  assert.equal(slots.size, 64);
});

test("carouselSignedOffset wraps the short way around a 17-report ring", () => {
  assert.equal(carouselSignedOffset(0, 0, 17), 0);
  assert.equal(carouselSignedOffset(1, 0, 17), 1);
  assert.equal(carouselSignedOffset(16, 0, 17), -1);
  assert.equal(carouselSignedOffset(0, 16, 17), 1);
  assert.equal(carouselSignedOffset(8, 0, 17), 8);
});

test("stepCarouselIndex wraps by default and can clamp", () => {
  assert.equal(stepCarouselIndex(0, -1, 17), 16);
  assert.equal(stepCarouselIndex(16, 1, 17), 0);
  assert.equal(stepCarouselIndex(3, 1, 17), 4);
  assert.equal(stepCarouselIndex(0, -1, 17, { wrap: false }), 0);
  assert.equal(stepCarouselIndex(16, 1, 17, { wrap: false }), 16);
  assert.equal(stepCarouselIndex(0, 1, 0), 0);
});

test("computeCarouselPose features the centre cover and recedes neighbours", () => {
  const featured = computeCarouselPose(0);
  const left = computeCarouselPose(-1);
  const right = computeCarouselPose(1);
  const far = computeCarouselPose(CAROUSEL_RADIUS + 1);
  const wing = computeCarouselPose(CAROUSEL_RADIUS);

  assert.equal(featured.featured, true);
  assert.equal(featured.visible, true);
  assert.equal(featured.scale, CAROUSEL_FEATURED_SCALE);
  assert.equal(featured.ry, CAROUSEL_FACE_YAW);
  assert.ok(featured.scale > left.scale);
  assert.ok(featured.z > left.z, "neighbours recede away from the camera");
  assert.ok(featured.z > right.z);
  assert.ok(left.x < 0 && right.x > 0);
  assert.ok(left.ry > featured.ry);
  assert.ok(right.ry < featured.ry);
  assert.ok(Math.abs(left.ry - CAROUSEL_FACE_YAW) <= CAROUSEL_YAW_CAP);
  assert.ok(Math.abs(right.ry - CAROUSEL_FACE_YAW) <= CAROUSEL_YAW_CAP);
  assert.ok(Math.abs(wing.ry - CAROUSEL_FACE_YAW) <= CAROUSEL_YAW_CAP);
  assert.equal(far.visible, false);
  assert.equal(far.featured, false);
});

test("a nine-report folder shows every cover in the carousel", () => {
  const count = 9;
  assert.equal(carouselVisibleRadius(count) * 2 + 1, 9);
  for (let i = 0; i < count; i += 1) {
    const pose = computeCarouselPose(carouselSignedOffset(i, 0, count), count);
    assert.equal(pose.visible, true);
  }
});

test("a large folder still shows more than five covers", () => {
  const count = 21;
  const visible = Array.from({ length: count }, (_, i) =>
    computeCarouselPose(carouselSignedOffset(i, 0, count), count).visible,
  ).filter(Boolean).length;
  assert.ok(visible >= 11);
  assert.ok(visible <= CAROUSEL_RADIUS * 2 + 1);
});

test("shortestAngleDelta takes the short way around", () => {
  assert.ok(Math.abs(shortestAngleDelta(0, Math.PI / 2) - Math.PI / 2) < 1e-9);
  assert.ok(shortestAngleDelta(Math.PI / 2, 0) < 0);
  assert.ok(shortestAngleDelta(-Math.PI / 2, Math.PI / 2) > 0);
  assert.ok(Math.abs(shortestAngleDelta(Math.PI - 0.1, -Math.PI + 0.1)) < 0.3);
});

test("carouselOrigin sits in front of the folder row", () => {
  const layout = computeLayout(fakeFolders([4, 4, 4]));
  const origin = carouselOrigin(layout);
  const zs = Object.values(layout.folderPos).map((pos) => pos.z);
  const folderFront = Math.max(
    ...Object.values(layout.folderPos).map((pos) => pos.z + FOLDER_D),
  );
  const neighbourZ = origin.z + computeCarouselPose(CAROUSEL_RADIUS).z;
  assert.ok(origin.z > Math.max(...zs));
  assert.ok(origin.z >= CAROUSEL_FORWARD);
  assert.ok(
    neighbourZ > folderFront,
    "side cards stay in front of folder fronts",
  );
  assert.ok(origin.z - CAROUSEL_RADIUS * CAROUSEL_RECEDE > folderFront);
});

test("carouselAnnouncement names the featured report", () => {
  assert.equal(
    carouselAnnouncement(3, 17, "Work and workplace"),
    "Report 4 of 17, Work and workplace",
  );
  assert.equal(carouselAnnouncement(0, 0, "Nope"), "No reports in this folder");
});

test("reportHitAllowed only picks reports from the open folder when filed", () => {
  assert.equal(
    reportHitAllowed({
      filed: false,
      selectedFolderId: null,
      folderId: "a",
    }),
    true,
  );
  assert.equal(
    reportHitAllowed({
      filed: true,
      selectedFolderId: null,
      folderId: "a",
    }),
    false,
  );
  assert.equal(
    reportHitAllowed({
      filed: true,
      selectedFolderId: "a",
      folderId: "a",
    }),
    true,
  );
  assert.equal(
    reportHitAllowed({
      filed: true,
      selectedFolderId: "a",
      folderId: "b",
    }),
    false,
  );
});
