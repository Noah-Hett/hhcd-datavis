import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ARCHIVE_ROWS,
  PEEK_REST,
  PEEK_SELECT,
  computeArchiveLayout,
  computeLayout,
  selectPeekSlot,
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
