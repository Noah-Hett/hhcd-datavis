import { emptyFilters, filterKey } from "./search.js";

export const FACET_GROUPS = [
  { dimension: "categories", legend: "Category" },
  { dimension: "projectTypes", legend: "Type" },
  { dimension: "methods", legend: "Method" },
  { dimension: "years", legend: "Year" },
];

export function facetKey(dimension, value) {
  if (dimension === "yearRanges") {
    return filterKey("yearRanges", `${value.from}-${value.to}`);
  }
  return filterKey(dimension, value);
}

export function sameFilterValue(dimension, left, right) {
  if (dimension === "yearRanges") {
    return left?.from === right?.from && left?.to === right?.to;
  }
  return String(left) === String(right);
}

export function filterContains(filters, dimension, value) {
  return (filters?.[dimension] ?? []).some((item) =>
    sameFilterValue(dimension, item, value),
  );
}

export function addFilter(filters, dimension, value) {
  const next = emptyFilters();
  for (const key of Object.keys(next)) {
    next[key] = [...(filters?.[key] ?? [])];
  }
  if (!filterContains(next, dimension, value)) {
    next[dimension] = [...next[dimension], value];
  }
  return next;
}

export function removeFilter(filters, dimension, value) {
  const next = emptyFilters();
  for (const key of Object.keys(next)) {
    next[key] = [...(filters?.[key] ?? [])];
  }
  next[dimension] = next[dimension].filter(
    (item) => !sameFilterValue(dimension, item, value),
  );
  return next;
}

export function filtersAreEmpty(filters) {
  return Object.values(filters ?? {}).every((value) => !value?.length);
}

/**
 * Toggle a facet. Manual picks are stored separately from query-parsed
 * filters; dismissing a query filter suppresses it instead of rewriting the
 * search box.
 */
export function toggleFacet({ dimension, value, manual, suppressed, parsedFilters }) {
  const key = facetKey(dimension, value);
  const blocked = new Set(suppressed);
  if (filterContains(manual, dimension, value)) {
    return {
      manual: removeFilter(manual, dimension, value),
      suppressed: suppressed.filter((item) => item !== key),
    };
  }
  if (filterContains(parsedFilters, dimension, value) && !blocked.has(key)) {
    return { manual, suppressed: [...suppressed, key] };
  }
  if (blocked.has(key)) {
    return {
      manual,
      suppressed: suppressed.filter((item) => item !== key),
    };
  }
  return { manual: addFilter(manual, dimension, value), suppressed };
}

export function clearFacetState(parsedFilters) {
  return {
    manual: emptyFilters(),
    suppressed: (parsedFilters ? Object.entries(parsedFilters) : []).flatMap(
      ([dimension, values]) =>
        (values ?? []).map((value) => facetKey(dimension, value)),
    ),
  };
}
