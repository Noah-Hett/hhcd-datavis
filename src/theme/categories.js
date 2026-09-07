/**
 * Shared theme palette for every visualisation.
 * Map dots, 3D jackets, and search all colour by the same five HHCD themes.
 */

export const THEMES = [
  {
    id: "health",
    label: "Health and wellbeing",
    color: "#b66474",
    initial: "H",
    categories: ["Health and wellbeing"],
  },
  {
    id: "transport",
    label: "Transport",
    color: "#977b3f",
    initial: "T",
    categories: ["Transport"],
  },
  {
    id: "mobility",
    label: "Mobility and Transport",
    color: "#798831",
    initial: "M",
    categories: ["Mobility and Transport"],
  },
  {
    id: "work",
    label: "Work and workplace",
    color: "#5889a9",
    initial: "W",
    categories: ["Work and workplace"],
  },
  {
    id: "city",
    label: "City and community",
    color: "#9773a1",
    initial: "C",
    categories: ["City and community"],
  },
];

/** Jacket type on coloured covers — cream, same family as the map paper. */
export const COVER_INK = "#F4EEE4";

/** Paper fallback when a report has no theme. */
export const COVER_FALLBACK = "#e8dfd0";

const THEME_BY_ID = Object.fromEntries(THEMES.map((theme) => [theme.id, theme]));

export function themeForCategory(category) {
  const raw = String(category || "").trim();
  if (!raw) return null;
  return (
    THEMES.find((theme) => theme.label === raw || theme.categories.includes(raw)) ??
    null
  );
}

export function themeColor(category, fallback = "#c4b8a8") {
  return themeForCategory(category)?.color ?? fallback;
}

/** 3D jacket colour — the report's theme, same hex as the map. */
export function coverColorFor(report) {
  const category = typeof report === "string" ? report : report?.category;
  return themeColor(category, COVER_FALLBACK);
}

export function themeByKey(key) {
  return THEME_BY_ID[key] ?? null;
}

/** Map legend / filter groups — same objects as THEMES. */
export const COLOR_GROUPS = THEMES;

/** Folder metadata palette — same objects as THEMES. */
export const CATEGORY_PALETTE = THEMES;
