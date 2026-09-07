import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = await readFile(resolve(root, "ReportSearch.jsx"), "utf8");
const css = await readFile(resolve(root, "styles.css"), "utf8");
const layout = await readFile(resolve(root, "../../components/Layout.jsx"), "utf8");

test("Simple view hides the header typeahead", () => {
  assert.match(layout, /mode === "simple" \? null : <SimpleSearch/);
});

test("Simple view does not duplicate Folders/Map/Simple waypoint nav", () => {
  assert.equal(src.includes("search-waypoints-slot"), false);
  assert.equal(src.includes("Explore waypoints"), false);
  assert.equal(src.includes("to={{ pathname: \"/\""), false);
  assert.equal(css.includes("search-waypoints-slot"), false);
});

test("idle Simple view does not live-announce a report count", () => {
  assert.equal(src.includes("search-page-eyebrow"), false);
  assert.match(
    src,
    /result\.idle \? null : \(\s*<p className="search-count" aria-live="polite">/,
  );
  assert.doesNotMatch(
    src,
    /result\.idle\s*\?\s*`\$\{rows\.length\} reports`/,
  );
});

test("hover does not move keyboard active; Enter follows focus", () => {
  assert.equal(src.includes("onMouseEnter"), false);
  assert.match(src, /onFocus=\{\(\) => setActive\(i\)\}/);
  assert.match(css, /\.search-row:hover/);
});

test("search input autofocuses only when ?q= is present", () => {
  assert.equal(src.includes("autoFocus\n"), false);
  assert.match(src, /autoFocus=\{Boolean\(urlQuery\.trim\(\)\)\}/);
});

test("list aria-label follows the query", () => {
  assert.match(src, /aria-label="All reports"/);
  assert.match(src, /Returned reports, \$\{matches\.length\}/);
  assert.match(src, /Rest of the catalogue, \$\{rest\.length\} reports/);
});

test("Simple view exposes clickable filters and splits returned rows", () => {
  assert.match(src, /<SearchFilters/);
  assert.match(src, /search-returned-heading/);
  assert.match(src, /Rest of the catalogue/);
  assert.match(css, /\.search-facet-pill\.is-selected/);
  assert.match(css, /\.search-group-title/);
});
