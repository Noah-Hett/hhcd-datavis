export function stepActive(current, key, length) {
  if (!length) return 0;
  if (key === "ArrowDown") return Math.min(length - 1, current + 1);
  if (key === "ArrowUp") return Math.max(0, current - 1);
  if (key === "Home") return 0;
  if (key === "End") return length - 1;
  return current;
}

export function isEditableTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" || tag === "TEXTAREA" || Boolean(target.isContentEditable)
  );
}

export function isOverlayTarget(target) {
  if (!target?.closest) return false;
  return Boolean(
    target.closest("dialog[open]") ||
      target.closest("#help-dialog") ||
      target.closest("#report-sidebar") ||
      target.closest(".report-sidebar-backdrop"),
  );
}

/**
 * Keyboard-first actions for the Simple view list.
 * Overlay (help / sidebar) wins: return null so those surfaces handle Escape.
 */
export function searchListKeyAction({
  key,
  typing,
  inInput,
  overlayOpen,
  length,
}) {
  if (overlayOpen) return null;
  if (key === "/" && !typing) return { type: "focus-input" };
  if (key === "Escape") {
    return inInput ? { type: "escape-input" } : { type: "focus-input" };
  }
  if (!length) return null;
  if (inInput && typing && key === "ArrowDown") {
    return { type: "focus-row", index: 0 };
  }
  if (inInput && typing) return null;
  if (
    key === "ArrowDown" ||
    key === "ArrowUp" ||
    key === "Home" ||
    key === "End"
  ) {
    return { type: "move", key };
  }
  if (key === "Enter") return { type: "open" };
  return null;
}
