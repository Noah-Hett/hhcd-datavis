import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyBackSidebar,
  applyClearReport,
  applyOpenFolder,
  applyOpenReport,
  applyReportSearchParam,
  groupingIdFromFolderId,
  locationWithReportParam,
  normalizeFolderId,
  normalizeReportId,
  reportParamNeedsReplace,
} from "./selection.js";

test("normalize ids stringify and drop empties", () => {
  assert.equal(normalizeReportId(11), "11");
  assert.equal(normalizeReportId(""), null);
  assert.equal(normalizeFolderId("theme:Health"), "theme:Health");
  assert.equal(normalizeFolderId(null), null);
});

test("groupingIdFromFolderId reads the grouping prefix", () => {
  assert.equal(groupingIdFromFolderId("theme:Health and wellbeing"), "theme");
  assert.equal(groupingIdFromFolderId("year:2004-2008"), "year");
  assert.equal(groupingIdFromFolderId("type:Prototype"), "type");
  assert.equal(groupingIdFromFolderId("nope"), null);
  assert.equal(groupingIdFromFolderId(null), null);
});

test("openReport sets the report, optional folder, and opens the sidebar", () => {
  const next = applyOpenReport(
    { selectedReportNo: null, selectedFolderId: null, sidebarOpen: false, source: null },
    "11",
    { folderId: "theme:Health and wellbeing", source: "archive" },
  );
  assert.deepEqual(next, {
    selectedReportNo: "11",
    selectedFolderId: "theme:Health and wellbeing",
    sidebarOpen: true,
    source: "archive",
  });
});

test("openReport without folderId does not keep a previous folder", () => {
  const next = applyOpenReport(
    {
      selectedReportNo: null,
      selectedFolderId: "theme:Health and wellbeing",
      sidebarOpen: true,
      source: "archive",
    },
    "86",
    { source: "search" },
  );
  assert.equal(next.selectedFolderId, null);
  assert.equal(next.source, "search");
});

test("openFolder selects a folder without opening the sidebar", () => {
  const next = applyOpenFolder(
    {
      selectedReportNo: "11",
      selectedFolderId: "theme:Health and wellbeing",
      sidebarOpen: true,
      source: "archive",
    },
    "year:2004-2008",
  );
  assert.deepEqual(next, {
    selectedReportNo: null,
    selectedFolderId: "year:2004-2008",
    sidebarOpen: false,
    source: null,
  });
});

test("openFolder with openSidebar: true opens the folder list", () => {
  const next = applyOpenFolder(
    {
      selectedReportNo: null,
      selectedFolderId: null,
      sidebarOpen: false,
      source: null,
    },
    "theme:Health and wellbeing",
    { openSidebar: true },
  );
  assert.equal(next.selectedFolderId, "theme:Health and wellbeing");
  assert.equal(next.selectedReportNo, null);
  assert.equal(next.sidebarOpen, true);
});

test("openFolder(null) deselects the folder without clearing sidebar-uninvolved chrome", () => {
  const fromOpen = applyOpenFolder(
    {
      selectedReportNo: null,
      selectedFolderId: "theme:Health",
      sidebarOpen: false,
      source: null,
    },
    null,
  );
  assert.equal(fromOpen.selectedFolderId, null);
  assert.equal(fromOpen.sidebarOpen, false);
  assert.equal(fromOpen.selectedReportNo, null);
});

test("openFolder(null) keeps an open report sidebar", () => {
  const fromOpen = applyOpenFolder(
    {
      selectedReportNo: "11",
      selectedFolderId: "theme:Health",
      sidebarOpen: true,
      source: "archive",
    },
    null,
  );
  assert.equal(fromOpen.selectedFolderId, null);
  assert.equal(fromOpen.selectedReportNo, "11");
  assert.equal(fromOpen.sidebarOpen, true);
  assert.equal(fromOpen.source, "archive");
});

test("backSidebar drops the report and keeps the folder list open", () => {
  const next = applyBackSidebar({
    selectedReportNo: "11",
    selectedFolderId: "theme:Health and wellbeing",
    sidebarOpen: true,
    source: "archive",
  });
  assert.deepEqual(next, {
    selectedReportNo: null,
    selectedFolderId: "theme:Health and wellbeing",
    sidebarOpen: true,
    source: "archive",
  });
});

test("backSidebar without a folder clears like Escape", () => {
  const next = applyBackSidebar({
    selectedReportNo: "11",
    selectedFolderId: null,
    sidebarOpen: true,
    source: "url",
  });
  assert.deepEqual(next, applyClearReport());
});

test("applyReportSearchParam sets and clears report without dropping other keys", () => {
  const withReport = applyReportSearchParam("q=health", "11");
  assert.equal(withReport.get("q"), "health");
  assert.equal(withReport.get("report"), "11");
  const cleared = applyReportSearchParam("?q=health&report=11", null);
  assert.equal(cleared.get("q"), "health");
  assert.equal(cleared.get("report"), null);
});

test("reportParamNeedsReplace skips a no-op write", () => {
  assert.equal(reportParamNeedsReplace("", null), false);
  assert.equal(reportParamNeedsReplace("report=11", "11"), false);
  assert.equal(reportParamNeedsReplace("", "11"), true);
  assert.equal(reportParamNeedsReplace("report=11", null), true);
});

test("locationWithReportParam keeps the Explore hash when opening a report", () => {
  assert.deepEqual(
    locationWithReportParam({ pathname: "/", search: "", hash: "#map" }, "86"),
    { pathname: "/", search: "?report=86", hash: "#map" },
  );
  assert.deepEqual(
    locationWithReportParam(
      { pathname: "/", search: "?report=11", hash: "#archive" },
      null,
    ),
    { pathname: "/", search: "", hash: "#archive" },
  );
});
