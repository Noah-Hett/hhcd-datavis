import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = await readFile(resolve(root, "ArchiveSection.jsx"), "utf8");

test("intro chrome files into #archive instead of opening a report", () => {
  assert.match(src, /hash: "archive"/);
  assert.match(src, /intro-scroll/);
  assert.match(src, /Scroll to file into folders/);
  assert.match(src, /onEnterArchive=\{enterArchive\}/);
  assert.match(src, /inclusive design reports/);
  assert.equal(src.includes("An unsorted heap"), false);
  assert.equal(src.includes("File into folders"), false);
  assert.equal(src.includes("HHCD Graduate and Associate Research Reports"), false);
});

const css = await readFile(resolve(root, "ArchiveSection.css"), "utf8");

test("mobile grouping tabs sit under the scene instead of over it", () => {
  assert.match(css, /@media \(max-width: 799px\)/);
  assert.match(css, /flex-direction: row/);
  assert.match(css, /align-self: center/);
  assert.match(css, /position: relative/);
});
