import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const layout = await readFile(resolve(root, "Layout.jsx"), "utf8");
const css = await readFile(resolve(root, "../index.css"), "utf8");
const help = await readFile(resolve(root, "HelpDialog.jsx"), "utf8");
const searchCss = await readFile(
  resolve(root, "../views/report-search/simple-search.css"),
  "utf8",
);

test("Home lives in the Folders/Map/Simple toggle, not a separate brand", () => {
  assert.match(layout, /id: "home"/);
  assert.match(layout, /hash: "intro"/);
  assert.equal(layout.includes("app-brand"), false);
  assert.equal(layout.includes("app-header-start"), false);
  assert.match(layout, /aria-label="View"/);
});

test("header Search is a compact button on mobile and Sidebar is hidden there", () => {
  assert.match(layout, /<SimpleSearch \/>/);
  assert.match(layout, /className="chrome-btn chrome-btn-sidebar"/);
  assert.match(css, /\.chrome-btn-sidebar\s*\{\s*display:\s*none;/);
  assert.match(css, /grid-template-areas:\s*"toggle toggle"\s*"search help"/);
  assert.match(searchCss, /\.simple-search-trigger \{\s*display: none;/);
  assert.match(
    searchCss,
    /@media \(max-width: 799px\)[\s\S]*\.simple-search-trigger \{\s*display: inline-flex;/,
  );
});

test("help copy describes Home inside the mode toggle", () => {
  assert.match(help, /Home \/ Folders \/ Map \/ Simple toggle/);
  assert.equal(help.includes("house Home control"), false);
});
