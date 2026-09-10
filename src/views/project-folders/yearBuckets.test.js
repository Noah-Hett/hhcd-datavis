import assert from "node:assert/strict";
import { test } from "node:test";
import { folderIdForFacet, yearBucketFor } from "./yearBuckets.js";

test("yearBucketFor maps catalogue years onto archive bands", () => {
  assert.equal(yearBucketFor(2000).id, "2000-2003");
  assert.equal(yearBucketFor(2003).label, "2000–2003");
  assert.equal(yearBucketFor(2004).id, "2004-2008");
  assert.equal(yearBucketFor(2017).id, "2013-2017");
});

test("folderIdForFacet builds sidebar browse ids", () => {
  assert.equal(
    folderIdForFacet("theme", "Health and wellbeing"),
    "theme:Health and wellbeing",
  );
  assert.equal(folderIdForFacet("year", 2011), "year:2009-2012");
  assert.equal(folderIdForFacet("method", "Desk Research"), "method:Desk Research");
  assert.equal(folderIdForFacet("type", null), null);
});
