import { themeColor } from "./categories.js";

export default function ThemeSwatch({ category, color, className = "" }) {
  const fill = color || themeColor(category);
  if (!fill) return null;
  return (
    <span
      className={["theme-swatch", className].filter(Boolean).join(" ")}
      style={{ background: fill }}
      aria-hidden="true"
    />
  );
}
