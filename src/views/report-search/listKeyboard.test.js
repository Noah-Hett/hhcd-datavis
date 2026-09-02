import assert from "node:assert/strict";
import test from "node:test";
import {
  isEditableTarget,
  isOverlayTarget,
  searchListKeyAction,
  stepActive,
} from "./listKeyboard.js";

test("arrow keys walk a report list without wrapping", () => {
  assert.equal(stepActive(0, "ArrowDown", 5), 1);
  assert.equal(stepActive(4, "ArrowDown", 5), 4);
  assert.equal(stepActive(2, "ArrowUp", 5), 1);
  assert.equal(stepActive(0, "ArrowUp", 5), 0);
});

test("Home and End jump the list ends", () => {
  assert.equal(stepActive(3, "Home", 8), 0);
  assert.equal(stepActive(3, "End", 8), 7);
  assert.equal(stepActive(0, "End", 0), 0);
});

test("editable and overlay targets are detected", () => {
  assert.equal(isEditableTarget({ tagName: "INPUT" }), true);
  assert.equal(isEditableTarget({ tagName: "DIV", isContentEditable: true }), true);
  assert.equal(isEditableTarget({ tagName: "BUTTON" }), false);
  assert.equal(
    isOverlayTarget({ closest: (sel) => sel === "#report-sidebar" }),
    true,
  );
  assert.equal(isOverlayTarget({ closest: () => null }), false);
});

test("Escape from a row returns to the input; overlay keys are ignored", () => {
  assert.deepEqual(
    searchListKeyAction({
      key: "Escape",
      typing: false,
      inInput: false,
      overlayOpen: false,
      length: 8,
    }),
    { type: "focus-input" },
  );
  assert.deepEqual(
    searchListKeyAction({
      key: "Escape",
      typing: true,
      inInput: true,
      overlayOpen: false,
      length: 8,
    }),
    { type: "escape-input" },
  );
  assert.equal(
    searchListKeyAction({
      key: "Escape",
      typing: false,
      inInput: false,
      overlayOpen: true,
      length: 8,
    }),
    null,
  );
});

test("slash, arrows, and Enter drive the list without wrapping helpers", () => {
  assert.deepEqual(
    searchListKeyAction({
      key: "/",
      typing: false,
      inInput: false,
      overlayOpen: false,
      length: 8,
    }),
    { type: "focus-input" },
  );
  assert.deepEqual(
    searchListKeyAction({
      key: "ArrowDown",
      typing: true,
      inInput: true,
      overlayOpen: false,
      length: 8,
    }),
    { type: "focus-row", index: 0 },
  );
  assert.deepEqual(
    searchListKeyAction({
      key: "Enter",
      typing: false,
      inInput: false,
      overlayOpen: false,
      length: 8,
    }),
    { type: "open" },
  );
  assert.deepEqual(
    searchListKeyAction({
      key: "Home",
      typing: false,
      inInput: false,
      overlayOpen: false,
      length: 8,
    }),
    { type: "move", key: "Home" },
  );
});
