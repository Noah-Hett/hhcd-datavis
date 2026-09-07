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

test("header suggestions show the shared theme swatch", () => {
  assert.match(src, /from "\.\.\/theme\/ThemeSwatch\.jsx"/);
  assert.match(src, /ThemeSwatch category=\{item\.report\.category\}/);
  assert.match(css, /grid-template-columns:\s*12px 3\.2rem 1fr/);
});
