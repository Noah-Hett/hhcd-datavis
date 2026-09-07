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
          return (
            <button
              key={key}
              type="button"
              className={pressed ? "search-facet-pill is-selected" : "search-facet-pill"}
              aria-pressed={pressed}
              onClick={() => onToggle(dimension, value)}
            >
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
          {chips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                className="search-chip is-applied"
                onClick={() => onDismissChip(chip)}
              >
                {chip.label}
                <span aria-hidden="true">×</span>
                <span className="sr-only">Remove filter</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
