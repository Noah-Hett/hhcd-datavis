import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const catalogue = JSON.parse(
  await readFile(resolve(dirname(fileURLToPath(import.meta.url)), "reports.json"), "utf8"),
);

const PRESET_METHODS = new Set([
  "Co-Design",
  "Critical User Forums",
  "Cultural Probes",
  "Desk Research",
  "Focus Groups",
  "Individual Interviews",
  "Mapping",
  "Mockups and Rapid Prototyping",
  "Observation",
  "Personas",
  "Role Playing",
  "Scenarios",
  "Workshops",
]);

const numberedIds = new Set(
  catalogue
    .map((report) => report.reportNo)
    .filter((id) => id != null && String(id).trim() !== "")
    .map((id) => String(id)),
);

function connectionIds(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

test("catalogue has 67 reports with stable app report numbers", () => {
  assert.equal(catalogue.length, 67);
  assert.equal(
    catalogue.filter((report) => report.reportNo == null).length,
    2,
  );
  assert.equal(
    catalogue.find((report) => report.title.startsWith("Pluspoint"))?.reportNo,
    null,
  );
  assert.equal(
    catalogue.find((report) => report.title.startsWith("The abilizer"))?.reportNo,
    null,
  );
});

test("methods use the CSV preset labels", () => {
  for (const report of catalogue) {
    assert.ok(Array.isArray(report.methodsPrimary));
    for (const method of report.methodsPrimary) {
      assert.ok(
        PRESET_METHODS.has(method),
        `${report.title} has non-preset method ${method}`,
      );
    }
  }
});

test("the two app-only reports keep app ids and use the agreed methods", () => {
  const aging = catalogue.find((report) => report.reportNo === "204");
  const lighting = catalogue.find((report) => report.reportNo === "63");
  assert.equal(aging?.title, "Aging in a vertical city");
  assert.deepEqual(aging.methodsPrimary, [
    "Observation",
    "Individual Interviews",
    "Co-Design",
    "Cultural Probes",
    "Scenarios",
  ]);
  assert.equal(lighting?.title.startsWith("Working Light"), true);
  assert.deepEqual(lighting.methodsPrimary, ["Desk Research"]);
});

test("connections are existing app report ids", () => {
  for (const report of catalogue) {
    for (const id of connectionIds(report.connections)) {
      assert.ok(
        numberedIds.has(id),
        `${report.title} connects to missing id ${id}`,
      );
      assert.notEqual(id, String(report.reportNo));
    }
  }
});

test("Heathrow Process to pleasure keeps the three-report series", () => {
  const heathrow = catalogue.filter((report) =>
    /process to pleasure/i.test(report.title),
  );
  assert.deepEqual(
    heathrow.map((report) => String(report.reportNo)).sort(),
    ["1", "21", "26"],
  );
  assert.deepEqual(connectionIds(heathrow.find((report) => report.reportNo === "1").connections), [
    "21",
    "26",
  ]);
  assert.deepEqual(connectionIds(heathrow.find((report) => report.reportNo === "21").connections), [
    "1",
    "26",
  ]);
  assert.deepEqual(connectionIds(heathrow.find((report) => report.reportNo === "26").connections), [
    "1",
    "21",
  ]);
});

test("the three spreadsheet rows are in the catalogue", () => {
  const recipes = catalogue.find((report) => report.reportNo === "166");
  const mind = catalogue.find((report) => report.reportNo === "186");
  const foyle = catalogue.find((report) => report.reportNo === "202");
  assert.equal(recipes?.title, "Hand Healthy Recipes");
  assert.deepEqual(recipes.methodsPrimary, []);
  assert.equal(recipes.partner, "Arthritis Research UK");
  assert.equal(mind?.title, "Design for the mind");
  assert.deepEqual(mind.methodsPrimary, [
    "Desk Research",
    "Individual Interviews",
    "Co-Design",
    "Critical User Forums",
  ]);
  assert.equal(mind.partner, "BSI");
  assert.equal(foyle?.title, "Our Future Foyle (not on master list)");
  assert.equal(foyle.projectType, "Media Campaign");
  assert.equal(foyle.targetedUser, "communities");
  assert.deepEqual(foyle.methodsPrimary, []);
  assert.equal(foyle.partner, "Public Health, Northern Ireland");
});

test("author contacts from the previous catalogue are kept", () => {
  const withContact = catalogue.filter(
    (report) => report.contact != null && String(report.contact).trim() !== "",
  );
  assert.equal(withContact.length, 19);
  assert.equal(
    catalogue.find((report) => report.reportNo === "11")?.contact,
    "https://www.linkedin.com/in/jennifer-brown-8b069771/",
  );
});

test("connections union keeps app links and valid spreadsheet links", () => {
  assert.deepEqual(connectionIds(catalogue.find((report) => report.reportNo === "13").connections), [
    "19",
    "20",
  ]);
  assert.deepEqual(
    connectionIds(catalogue.find((report) => report.reportNo === "106").connections),
    ["68", "166"],
  );
  assert.deepEqual(connectionIds(catalogue.find((report) => report.reportNo === "73").connections), [
    "122",
  ]);
  assert.deepEqual(
    connectionIds(catalogue.find((report) => report.reportNo === "122").connections),
    ["73"],
  );
});
