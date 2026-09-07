import { themeForCategory } from "../../theme/categories.js";
import { FACET_GROUPS, selectValueForDimension } from "./filters.js";

function FacetSelect({
  legend,
  dimension,
  options,
  chips,
  onSet,
}) {
  if (!options.length) return null;
  const value = selectValueForDimension(chips, dimension);
  const theme =
    dimension === "categories" && value ? themeForCategory(value) : null;
  const selectId = `search-facet-${dimension}`;
  return (
    <div className="search-facet">
      <label htmlFor={selectId} className="search-facet-label">
        {legend}
      </label>
      <select
        id={selectId}
        className={theme ? "search-facet-select is-theme" : "search-facet-select"}
        style={theme ? { "--theme-color": theme.color } : undefined}
        value={value}
        onChange={(event) => onSet(dimension, event.target.value)}
      >
        <option value="">All</option>
        {options.map((option) => {
          const optionValue = String(option.label);
          return (
            <option key={optionValue} value={optionValue}>
              {option.label} ({option.count})
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default function SearchFilters({
  facets,
  chips,
  canClear,
  onSet,
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
      <div
        className="search-facets"
        role="group"
        aria-labelledby="search-filters-heading"
      >
        {FACET_GROUPS.map((group) => (
          <FacetSelect
            key={group.dimension}
            legend={group.legend}
            dimension={group.dimension}
            options={facets[group.dimension] ?? []}
            chips={chips}
            onSet={onSet}
          />
        ))}
      </div>
    </div>
  );
}
