import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CATEGORY_PALETTE,
  COLOR_GROUPS,
  COVER_INK,
  coverColorFor,
  themeColor,
  themeForCategory,
} from "./categories.js";
import { COLOR_GROUPS as MAP_GROUPS, mapReports } from "../views/year-type-scatter/mapReports.js";

const root = dirname(fileURLToPath(import.meta.url));

test("map, jackets, and folders share one theme palette", () => {
  assert.equal(MAP_GROUPS, COLOR_GROUPS);
  assert.equal(CATEGORY_PALETTE, COLOR_GROUPS);
  assert.equal(COLOR_GROUPS.length, 5);
  assert.equal(new Set(COLOR_GROUPS.map((theme) => theme.color)).size, 5);
});

test("3D jacket colour is the map colour for every theme", () => {
  for (const group of COLOR_GROUPS) {
    const report = {
      reportNo: 1,
      year: 2010,
      projectType: "design concepts",
      category: group.label,
    };
    const mapped = mapReports([report]);
    assert.equal(coverColorFor(report), group.color);
    assert.equal(coverColorFor(group.label), group.color);
    assert.equal(themeColor(group.label), group.color);
    assert.equal(mapped.clusters[0].color, group.color);
  }
});

test("unknown categories stay off the map and fall back on jackets", () => {
  assert.equal(themeForCategory("Not a theme"), null);
  const mapped = mapReports([
    {
      reportNo: 9,
      year: 2010,
      projectType: "design concepts",
      category: "Not a theme",
    },
  ]);
  assert.equal(mapped.plottedCount, 0);
  assert.notEqual(coverColorFor({ category: "Not a theme" }), themeColor("Health and wellbeing"));
});

test("cover type is cream so it reads on the theme jackets", () => {
  assert.equal(COVER_INK, "#F4EEE4");
});

test("theme badges keep dark text on a tinted wash, not colour-only dots", async () => {
  const css = await readFile(resolve(root, "../index.css"), "utf8");
  assert.match(css, /\.theme-badge\s*\{/);
  assert.match(
    css,
    /\.theme-badge\s*\{[^}]*color:\s*var\(--text\)/s,
  );
  assert.match(css, /color-mix\(in srgb, var\(--theme-color\) 22%/);
});

test("archive jackets paint the shared theme colour, not a hash of report number", async () => {
  const geometry = await readFile(resolve(root, "../views/project-folders/geometry.js"), "utf8");
  const grouping = await readFile(resolve(root, "../views/project-folders/grouping.js"), "utf8");
  assert.match(geometry, /coverColorFor\(report\)/);
  assert.doesNotMatch(geometry, /COVER_POOL/);
  assert.match(geometry, /COVER_INK/);
  assert.match(grouping, /themeForCategory/);
  assert.doesNotMatch(grouping, /COVER_POOL/);
});
