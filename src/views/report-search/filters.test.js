import assert from "node:assert/strict";
import test from "node:test";
import { emptyFilters } from "./search.js";
import {
  addFilter,
  clearFacetState,
  facetKey,
  filterContains,
  removeFilter,
  selectValueForDimension,
  setDimension,
  toggleFacet,
} from "./filters.js";

test("facet keys match search chip keys", () => {
  assert.equal(facetKey("categories", "Health and wellbeing"), "categories:Health and wellbeing");
  assert.equal(facetKey("years", 2001), "years:2001");
  assert.equal(facetKey("yearRanges", { from: 2000, to: 2004 }), "yearRanges:2000-2004");
});

test("add and remove keep other dimensions", () => {
  const start = addFilter(emptyFilters(), "categories", "Health and wellbeing");
  const withMethod = addFilter(start, "methods", "Observation");
  assert.equal(filterContains(withMethod, "categories", "Health and wellbeing"), true);
  assert.equal(filterContains(withMethod, "methods", "Observation"), true);
  const removed = removeFilter(withMethod, "categories", "Health and wellbeing");
  assert.equal(filterContains(removed, "categories", "Health and wellbeing"), false);
  assert.equal(filterContains(removed, "methods", "Observation"), true);
});

test("toggle adds a manual filter then removes it", () => {
  const added = toggleFacet({
    dimension: "projectTypes",
    value: "Design Concepts",
    manual: emptyFilters(),
    suppressed: [],
    parsedFilters: emptyFilters(),
  });
  assert.deepEqual(added.manual.projectTypes, ["Design Concepts"]);
  const removed = toggleFacet({
    dimension: "projectTypes",
    value: "Design Concepts",
    manual: added.manual,
    suppressed: added.suppressed,
    parsedFilters: emptyFilters(),
  });
  assert.deepEqual(removed.manual.projectTypes, []);
});

test("toggle suppresses a query-parsed filter instead of rewriting the query", () => {
  const parsedFilters = emptyFilters();
  parsedFilters.methods = ["Individual Interviews"];
  const suppressed = toggleFacet({
    dimension: "methods",
    value: "Individual Interviews",
    manual: emptyFilters(),
    suppressed: [],
    parsedFilters,
  });
  assert.deepEqual(suppressed.suppressed, ["methods:Individual Interviews"]);
  assert.deepEqual(suppressed.manual.methods, []);
  const restored = toggleFacet({
    dimension: "methods",
    value: "Individual Interviews",
    manual: suppressed.manual,
    suppressed: suppressed.suppressed,
    parsedFilters,
  });
  assert.deepEqual(restored.suppressed, []);
});

test("clearFacetState drops manual picks and suppresses parsed chips", () => {
  const parsedFilters = emptyFilters();
  parsedFilters.categories = ["Transport"];
  parsedFilters.years = [2001];
  const next = clearFacetState(parsedFilters);
  assert.deepEqual(next.manual.categories, []);
  assert.deepEqual(next.suppressed.sort(), ["categories:Transport", "years:2001"]);
});

test("setDimension keeps one value per menu and can clear it", () => {
  const first = setDimension({
    dimension: "methods",
    value: "Observation",
    manual: emptyFilters(),
    suppressed: [],
    parsedFilters: emptyFilters(),
  });
  assert.deepEqual(first.manual.methods, ["Observation"]);
  const swapped = setDimension({
    dimension: "methods",
    value: "Cultural Probes",
    manual: first.manual,
    suppressed: first.suppressed,
    parsedFilters: emptyFilters(),
  });
  assert.deepEqual(swapped.manual.methods, ["Cultural Probes"]);
  const cleared = setDimension({
    dimension: "methods",
    value: "",
    manual: swapped.manual,
    suppressed: swapped.suppressed,
    parsedFilters: emptyFilters(),
  });
  assert.deepEqual(cleared.manual.methods, []);
});

test("setDimension suppresses a query-parsed year without rewriting the query", () => {
  const parsedFilters = emptyFilters();
  parsedFilters.years = [2001];
  const cleared = setDimension({
    dimension: "years",
    value: "",
    manual: emptyFilters(),
    suppressed: [],
    parsedFilters,
  });
  assert.deepEqual(cleared.suppressed, ["years:2001"]);
  assert.deepEqual(cleared.manual.years, []);
  const restored = setDimension({
    dimension: "years",
    value: "2001",
    manual: cleared.manual,
    suppressed: cleared.suppressed,
    parsedFilters,
  });
  assert.deepEqual(restored.suppressed, []);
  assert.deepEqual(restored.manual.years, []);
});

test("selectValueForDimension reads the applied chip", () => {
  assert.equal(selectValueForDimension([], "categories"), "");
  assert.equal(
    selectValueForDimension(
      [{ dimension: "categories", value: "Transport", key: "categories:Transport" }],
      "categories",
    ),
    "Transport",
  );
  assert.equal(
    selectValueForDimension([{ dimension: "years", value: 2001, key: "years:2001" }], "years"),
    "2001",
  );
});
