import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const layout = await readFile(resolve(root, "Layout.jsx"), "utf8");
const sidebar = await readFile(resolve(root, "ReportSidebar.jsx"), "utf8");
const help = await readFile(resolve(root, "HelpGuide.jsx"), "utf8");

test("Help opens in the report sidebar, not a dialog", () => {
  assert.equal(layout.includes("HelpDialog"), false);
  assert.equal(layout.includes("help-dialog"), false);
  assert.match(layout, /openHelp/);
  assert.match(layout, /aria-controls="report-sidebar"/);
  assert.match(sidebar, /HelpGuide/);
  assert.match(help, /How to use this catalogue/);
});
