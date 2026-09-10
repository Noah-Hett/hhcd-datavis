import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const sidebar = await readFile(resolve(root, "ReportSidebar.jsx"), "utf8");
const css = await readFile(resolve(root, "../index.css"), "utf8");

test("sidebar chips are compact pills without stacked kind labels", () => {
  assert.equal(sidebar.includes("report-sidebar-facet-kind"), false);
  assert.match(
    sidebar,
    /className="report-sidebar-facet-count">\{facet.count\}</,
  );
  assert.match(sidebar, /theme \? "report-sidebar-facet is-theme"/);
  assert.match(
    css,
    /\.report-sidebar-facet \{[\s\S]*?border-radius:\s*999px/,
  );
  assert.match(css, /\.report-sidebar-facet \{[\s\S]*?min-height:\s*32px/);
  assert.match(
    css,
    /\.report-sidebar-facet\.is-theme \{[\s\S]*?var\(--theme-color\)/,
  );
});

test("sidebar menus use chrome colour and round corners, not warm square cards", () => {
  const sidebarCss = css.slice(css.indexOf("/* --- Report sidebar"));
  assert.equal(sidebarCss.includes("#fffdf8"), false);
  assert.equal(sidebarCss.includes("--archive-hover"), false);
  assert.match(
    sidebarCss,
    /\.report-sidebar \.sidebar-grouping \{[\s\S]*?border-radius:\s*999px/,
  );
  assert.match(
    sidebarCss,
    /\.report-sidebar \.folder-list \{[\s\S]*?border-radius:\s*16px/,
  );
  assert.match(
    sidebarCss,
    /\.report-sidebar \.report-sidebar-related \{[\s\S]*?border-radius:\s*16px/,
  );
  assert.match(sidebarCss, /background:\s*var\(--hover\)/);
  assert.match(sidebarCss, /background:\s*var\(--chrome\)/);
});
