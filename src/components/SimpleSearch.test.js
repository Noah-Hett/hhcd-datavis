import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = await readFile(resolve(root, "SimpleSearch.jsx"), "utf8");
const css = await readFile(
  resolve(root, "../views/report-search/simple-search.css"),
  "utf8",
);

test("header suggestions name the theme with a labelled badge", () => {
  assert.match(src, /from "\.\.\/theme\/ThemeBadge\.jsx"/);
  assert.match(src, /<ThemeBadge/);
  assert.match(src, /compact/);
  assert.doesNotMatch(src, /ThemeSwatch/);
  assert.match(css, /border-left:\s*6px solid var\(--theme-color/);
});
