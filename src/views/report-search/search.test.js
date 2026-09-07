import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildIndex,
  buildVocab,
  emptyFilters,
  highlightParts,
  levenshtein,
  parseQuery,
  search,
} from "./search.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const reports = JSON.parse(
  await readFile(resolve(root, "src/data/reports.json"), "utf8"),
);
const vocab = buildVocab(reports);
const index = buildIndex(reports);

function run(query) {
  return search(reports, query, { vocab, index });
}

test("catalogue has the refreshed 67 reports", () => {
  assert.equal(reports.length, 67);
});

test("search never removes reports from the field", () => {
  const { all, pops } = run("health interviews 2001");
  assert.equal(all.length, 67);
  assert.ok(pops.length >= 2);
  assert.ok(pops.length < 67);
});

test("health interviews 2001 still surfaces the close reports", () => {
  const parsed = parseQuery("health interviews 2001", vocab);
  assert.deepEqual(parsed.filters.categories, ["Health and wellbeing"]);
  assert.deepEqual(parsed.filters.methods, ["Individual Interviews"]);
  assert.deepEqual(parsed.filters.years, [2001]);
  const { pops } = run("health interviews 2001");
  const titles = pops.map((item) => item.report.title);
  assert.ok(titles.some((title) => title.includes("Stepping stone")));
  assert.ok(titles.some((title) => title.includes("Foot print")));
});

test("taxi pops matching reports without emptying the field", () => {
  const { pops, all } = run("taxi");
  assert.equal(all.length, 67);
  assert.ok(pops.some((item) => /taxi/i.test(item.report.title)));
  assert.ok(
    pops.some((item) => String(item.report.targetedUser ?? "").toLowerCase().includes("taxi")),
  );
});

test("typos still find observation reports", () => {
  assert.ok(levenshtein("observaton", "observation") <= 2);
  const { pops, corrections, all } = run("observaton");
  assert.equal(all.length, 67);
  assert.ok(corrections.some((item) => item.to.includes("observ")));
  assert.ok(
    pops.some((item) =>
      (item.report.methodsPrimary ?? []).some((method) => /observ/i.test(method)),
    ),
  );
});

test("#11 finds e-scape at the top", () => {
  const { pops, all } = run("#11");
  assert.equal(all.length, 67);
  assert.equal(pops[0].report.title.startsWith("e-scape"), true);
});

test("urban lighting ranks lighting reports", () => {
  const { pops } = run("urban lighting");
  assert.ok(
    pops.some((item) =>
      /light/i.test(`${item.report.title} ${item.report.description}`),
    ),
  );
});

test("growing older is a semantic neighbourhood, not an exact phrase", () => {
  const { pops, themes, all } = run("growing older");
  assert.equal(all.length, 67);
  assert.ok(themes.some((theme) => theme.label === "Growing older"));
  assert.ok(
    pops.some((item) =>
      /age|older|dementia|elderly/i.test(
        `${item.report.title} ${item.report.description} ${item.report.targetedUser}`,
      ),
    ),
  );
});

test("prototype stays a suggestion and still pops nearby work", () => {
  const { suggestions, pops, all } = run("prototype");
  assert.equal(all.length, 67);
  assert.ok(suggestions.some((item) => item.dimension === "projectTypes"));
  assert.ok(pops.length >= 1);
});

test("aging vertical city finds the new 2017 report", () => {
  const { pops } = run("aging vertical city");
  assert.ok(pops.some((item) => item.report.reportNo === "204"));
});

test("cultural probes is a preset method filter", () => {
  const parsed = parseQuery("cultural probes", vocab);
  assert.deepEqual(parsed.filters.methods, ["Cultural Probes"]);
  const { pops } = run("cultural probes");
  assert.ok(
    pops.some(
      (item) =>
        item.report.reportNo === "204" &&
        (item.report.methodsPrimary ?? []).includes("Cultural Probes"),
    ),
  );
});

test("highlight wraps matching terms", () => {
  const parts = highlightParts("Taxi drivers; taxi passengers", ["taxi"]);
  assert.ok(parts.some((part) => part.hit && part.text.toLowerCase() === "taxi"));
});

test("search splits returned reports from the rest of the catalogue", () => {
  const { all, matches, rest, idle } = run("health interviews 2001");
  assert.equal(idle, false);
  assert.equal(all.length, 67);
  assert.ok(matches.length >= 2);
  assert.equal(matches.length + rest.length, 67);
  for (const item of matches) {
    assert.equal(item.report.category, "Health and wellbeing");
    assert.equal(item.report.year, 2001);
    assert.ok(
      (item.report.methodsPrimary ?? []).includes("Individual Interviews"),
    );
  }
});

test("manual category filter returns that theme without a query", () => {
  const manual = emptyFilters();
  manual.categories = ["Health and wellbeing"];
  const { matches, rest, idle, chips } = search(reports, "", {
    vocab,
    index,
    manual,
  });
  assert.equal(idle, false);
  assert.ok(chips.some((chip) => chip.value === "Health and wellbeing"));
  assert.ok(matches.length >= 18);
  assert.ok(rest.length > 0);
  assert.equal(matches.length + rest.length, 67);
  assert.ok(matches.every((item) => item.report.category === "Health and wellbeing"));
  assert.ok(rest.every((item) => item.report.category !== "Health and wellbeing"));
});

test("text plus a method filter intersects instead of returning every method report", () => {
  const manual = emptyFilters();
  manual.methods = ["Observation"];
  const { matches } = search(reports, "lighting", { vocab, index, manual });
  assert.ok(matches.length > 0);
  assert.ok(matches.length < 34);
  assert.ok(
    matches.every((item) =>
      (item.report.methodsPrimary ?? []).includes("Observation"),
    ),
  );
});
