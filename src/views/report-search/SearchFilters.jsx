import ThemeSwatch from "../../theme/ThemeSwatch.jsx";
import { themeForCategory } from "../../theme/categories.js";
import { FACET_GROUPS } from "./filters.js";

function FacetPills({ legend, dimension, options, selectedKeys, onToggle }) {
  if (!options.length) return null;
  return (
    <fieldset className="search-facet">
      <legend>{legend}</legend>
      <div className="search-facet-pills">
        {options.map((option) => {
          const value = option.label;
          const key = `${dimension}:${value}`;
          const pressed = selectedKeys.has(key);
          const theme =
            dimension === "categories" ? themeForCategory(value) : null;
          return (
            <button
              key={key}
              type="button"
              className={[
                "search-facet-pill",
                pressed ? "is-selected" : "",
                theme ? "is-theme" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={theme ? { "--theme-color": theme.color } : undefined}
              aria-pressed={pressed}
              onClick={() => onToggle(dimension, value)}
            >
              {theme ? <ThemeSwatch category={value} /> : null}
              {value}
              <span className="search-facet-count">{option.count}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function SearchFilters({
  facets,
  chips,
  selectedKeys,
  canClear,
  onToggle,
  onDismissChip,
  onClear,
}) {
  return (
    <div className="search-filters">
      <div className="search-filters-bar">
        <p className="search-filters-label" id="search-filters-heading">
          Filters
        </p>
        {canClear ? (
          <button type="button" className="search-filters-clear" onClick={onClear}>
            Clear filters
          </button>
        ) : null}
      </div>
      <div className="search-facets" aria-labelledby="search-filters-heading">
        {FACET_GROUPS.map((group) => (
          <FacetPills
            key={group.dimension}
            legend={group.legend}
            dimension={group.dimension}
            options={facets[group.dimension] ?? []}
            selectedKeys={selectedKeys}
            onToggle={onToggle}
          />
        ))}
      </div>
      {chips.length > 0 ? (
        <ul className="search-chips" aria-label="Applied filters">
          {chips.map((chip) => {
            const theme =
              chip.dimension === "categories"
                ? themeForCategory(chip.value)
                : null;
            return (
              <li key={chip.key}>
                <button
                  type="button"
                  className={
                    theme
                      ? "search-chip is-applied is-theme"
                      : "search-chip is-applied"
                  }
                  style={theme ? { "--theme-color": theme.color } : undefined}
                  onClick={() => onDismissChip(chip)}
                >
                  {theme ? <ThemeSwatch category={chip.value} /> : null}
                  {chip.label}
                  <span aria-hidden="true">×</span>
                  <span className="sr-only">Remove filter</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
