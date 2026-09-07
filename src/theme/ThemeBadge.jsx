import { themeForCategory } from "./categories.js";

export default function ThemeBadge({ category, compact = false }) {
  const theme = themeForCategory(category);
  if (!theme) return null;
  return (
    <span
      className={compact ? "theme-badge is-compact" : "theme-badge"}
      style={{ "--theme-color": theme.color }}
    >
      {theme.label}
    </span>
  );
}
