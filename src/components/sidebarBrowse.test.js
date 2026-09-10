import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  browseFacetsFor,
  connectedReports,
  metaLineForGrouping,
  parseConnectionIds,
  siblingReports,
} from "./sidebarBrowse.js";
import {
  folderIdForFacet,
  yearBucketFor,
} from "../views/project-folders/yearBuckets.js";

const catalogue = JSON.parse(
  await readFile(
    resolve(dirname(fileURLToPath(import.meta.url)), "../data/reports.json"),
    "utf8",
  ),
);

test("parseConnectionIds splits, trims, and drops empties", () => {
  assert.deepEqual(parseConnectionIds("21, 26"), ["21", "26"]);
  assert.deepEqual(parseConnectionIds("  19,20, "), ["19", "20"]);
  assert.deepEqual(parseConnectionIds(null), []);
  assert.deepEqual(parseConnectionIds(""), []);
});

test("folderIdForFacet and yearBucketFor match archive folders", () => {
  assert.equal(
    folderIdForFacet("theme", "Health and wellbeing"),
    "theme:Health and wellbeing",
  );
  assert.equal(folderIdForFacet("type", "Policy guidelines"), "type:Policy guidelines");
  assert.equal(folderIdForFacet("method", "Observation"), "method:Observation");
  assert.equal(yearBucketFor(2001).id, "2000-2003");
  assert.equal(folderIdForFacet("year", 2001), "year:2000-2003");
  assert.equal(folderIdForFacet("theme", ""), null);
});

test("browseFacetsFor exposes theme, type, year band, and methods", () => {
  const report = catalogue.find((item) => String(item.reportNo) === "11");
  const facets = browseFacetsFor(report, catalogue);
  const kinds = facets.map((facet) => facet.kind);
  assert.deepEqual(kinds.slice(0, 3), ["theme", "type", "year"]);
  assert.ok(kinds.includes("method"));
  const theme = facets.find((facet) => facet.kind === "theme");
  assert.equal(theme.label, "City and community");
  assert.equal(theme.folderId, "theme:City and community");
  assert.ok(theme.count >= 2);
  const year = facets.find((facet) => facet.kind === "year");
  assert.equal(year.label, "2000–2003");
  const observation = facets.find((facet) => facet.label === "Observation");
  assert.equal(observation.kind, "method");
  assert.equal(
    observation.count,
    catalogue.filter((item) =>
      (item.methodsPrimary ?? []).includes("Observation"),
    ).length,
  );
});

test("Health and wellbeing is a clickable theme facet", () => {
  const report = catalogue.find(
    (item) => item.category === "Health and wellbeing",
  );
  assert.ok(report);
  const theme = browseFacetsFor(report, catalogue).find(
    (facet) => facet.kind === "theme",
  );
  assert.equal(theme.folderId, "theme:Health and wellbeing");
  assert.equal(theme.label, "Health and wellbeing");
  assert.equal(
    theme.count,
    catalogue.filter((item) => item.category === "Health and wellbeing").length,
  );
});

test("connectedReports resolves catalogue titles from ids", () => {
  const report = catalogue.find((item) => String(item.reportNo) === "1");
  const linked = connectedReports(report, catalogue);
  assert.deepEqual(
    linked.map((item) => String(item.reportNo)).sort(),
    ["21", "26"],
  );
  assert.ok(linked.every((item) => item.title));
});

test("siblingReports lists other reports in the same theme", () => {
  const report = catalogue.find((item) => String(item.reportNo) === "11");
  const { reports: siblings, total } = siblingReports(report, catalogue, 3);
  assert.ok(total >= siblings.length);
  assert.equal(siblings.length, Math.min(3, total));
  assert.ok(
    siblings.every(
      (item) =>
        item.category === report.category &&
        String(item.reportNo) !== String(report.reportNo),
    ),
  );
});

test("metaLineForGrouping drops the redundant facet on each row", () => {
  const report = {
    year: 2001,
    category: "City and community",
    projectType: "Policy guidelines",
  };
  assert.equal(metaLineForGrouping("theme", report), "2001 · Policy guidelines");
  assert.equal(metaLineForGrouping("year", report), "2001 · City and community");
  assert.equal(metaLineForGrouping("method", report), "2001 · City and community");
});
