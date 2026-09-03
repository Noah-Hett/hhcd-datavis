/**
 * Header selection from the URL: Home (pile), Folders, Map, or Simple.
 * Empty Explore hash is treated as the intro pile.
 */
export function modeFromLocation(pathname, hash) {
  if (String(pathname || "").startsWith("/search")) return "simple";
  const id = String(hash || "").replace(/^#/, "");
  if (id === "map") return "map";
  if (id === "archive") return "folders";
  return "home";
}
