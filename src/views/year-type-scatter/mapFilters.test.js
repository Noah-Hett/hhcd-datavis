import assert from "node:assert/strict";
import test from "node:test";
import {
  MAP_SELECTION_SOURCE,
  methodPillClassName,
  methodPillState,
  reportsMatchingMethods,
  uniqueMethods,
} from "./mapFilters.js";
import { clusterAriaLabel, mapReports } from "./mapReports.js";
import { contrastRatio, shouldPeekFirst } from "./mapInteraction.js";
import { METHOD_PILL_THEME as theme } from "./methodPillTheme.js";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const reports = [
  { reportNo: 1, methods: ["Interviews", "Survey"] },
  { reportNo: 2, methods: ["Survey"] },
  { reportNo: 3, methods: ["Workshop"] },
];

test("map selection source is map", () => {
  assert.equal(MAP_SELECTION_SOURCE, "map");
});

test("MapSection opens the shared sidebar from the map source", async () => {
  const source = await readFile(
    new URL("../explore/MapSection.jsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /source:\s*MAP_SELECTION_SOURCE/);
  assert.match(source, /shouldPeekFirst/);
  assert.match(source, /tooltipAnchorAboveDot/);
  assert.match(source, /onActivate=\{handleTooltipActivate\}/);
  assert.match(source, /variant=\{mobile \? "sheet" : "carousel"\}/);
  assert.match(source, /showModal/);
  assert.match(source, /event\.key !== "Escape"/);
});

test("uniqueMethods lists every method and never drops labels", () => {
  const methods = uniqueMethods(reports);
  assert.deepEqual(
    methods.map((method) => method.label),
    ["Interviews", "Survey", "Workshop"],
  );
  assert.equal(methods.find((method) => method.label === "Survey")?.count, 2);
});

test("reportsMatchingMethods keeps the full field when nothing is selected", () => {
  assert.equal(reportsMatchingMethods(reports, new Set()).length, 3);
});

test("reportsMatchingMethods filters in place without hiding method pills", () => {
  const selected = new Set(["Survey"]);
  const matched = reportsMatchingMethods(reports, selected);
  assert.deepEqual(
    matched.map((report) => report.reportNo),
    [1, 2],
  );
  const pills = uniqueMethods(reports).map((method) =>
    methodPillState(method.label, selected),
  );
  assert.equal(pills.length, 3);
  assert.ok(pills.every((pill) => pill.hidden === false));
  assert.equal(pills.filter((pill) => pill.inactive).length, 2);
  assert.equal(pills.filter((pill) => pill.pressed).length, 1);
});

test("inactive pills stay rendered with is-inactive, not a hidden class", () => {
  assert.equal(
    methodPillClassName({ pressed: false, inactive: true }),
    "method-pill is-inactive",
  );
  assert.doesNotMatch(
    methodPillClassName({ pressed: false, inactive: true }),
    /hidden|is-hidden/,
  );
});

test("first coarse tap peeks; keyboard and second tap open", () => {
  assert.equal(
    shouldPeekFirst({
      keyboard: false,
      coarsePointer: true,
      lastTapKey: null,
      clusterKey: "a",
    }),
    true,
  );
  assert.equal(
    shouldPeekFirst({
      keyboard: false,
      coarsePointer: true,
      lastTapKey: "a",
      clusterKey: "a",
    }),
    false,
  );
  assert.equal(
    shouldPeekFirst({
      keyboard: true,
      coarsePointer: true,
      lastTapKey: null,
      clusterKey: "a",
    }),
    false,
  );
  assert.equal(
    shouldPeekFirst({
      keyboard: false,
      coarsePointer: false,
      lastTapKey: null,
      clusterKey: "a",
    }),
    false,
  );
});

test("clusterAriaLabel names title, year, and type band", () => {
  const label = clusterAriaLabel({
    year: 2008,
    yBand: 3,
    reports: [{ title: "Mobility kit" }],
  });
  assert.equal(label, "Mobility kit, 2008, Physical prototypes");
});

test("mapReports still plots the catalogue with theme groups", async () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  const catalogue = JSON.parse(
    await readFile(resolve(root, "src/data/reports.json"), "utf8"),
  );
  const mapped = mapReports(
    catalogue.map((report) => ({
      ...report,
      methods: report.methodsPrimary ?? [],
    })),
  );
  assert.ok(mapped.plottedCount > 0);
  assert.ok(mapped.clusters.every((cluster) => cluster.color));
});

test("method pill swatches meet 3:1 UI and 4.5:1 text contrast", () => {
  const uiPairs = [
    [theme.defaultBorder, theme.adjacentBg],
    [theme.defaultBorder, theme.defaultBg],
    [theme.defaultBorder, theme.mapAdjacentBg],
    [theme.inactiveBorder, theme.adjacentBg],
    [theme.inactiveBorder, theme.inactiveBg],
    [theme.inactiveBorder, theme.mapAdjacentBg],
  ];
  for (const [foreground, background] of uiPairs) {
    assert.ok(
      contrastRatio(foreground, background) >= 3,
      `${foreground} on ${background} is ${contrastRatio(foreground, background).toFixed(2)}:1`,
    );
  }

  const textPairs = [
    [theme.defaultText, theme.defaultBg],
    [theme.inactiveText, theme.inactiveBg],
    [theme.selectedText, theme.selectedBg],
  ];
  for (const [foreground, background] of textPairs) {
    assert.ok(
      contrastRatio(foreground, background) >= 4.5,
      `${foreground} on ${background} is ${contrastRatio(foreground, background).toFixed(2)}:1`,
    );
  }
});

test("styles.css keeps the documented inactive greys", async () => {
  const css = await readFile(
    new URL("./styles.css", import.meta.url),
    "utf8",
  );
  assert.match(css, /\.method-pill\.is-inactive\s*\{[^}]*background:\s*#cfcfcf/i);
  assert.match(css, /\.method-pill\.is-inactive\s*\{[^}]*border-color:\s*#5a5a5a/i);
  assert.match(css, /\.method-pill\.is-inactive\s*\{[^}]*color:\s*#222222/i);
  assert.match(css, /\.method-pill\s*\{[^}]*border:\s*1px solid #5c5348/i);
  assert.doesNotMatch(css, /\.method-pill\.is-inactive\s*\{[^}]*display:\s*none/);
});
