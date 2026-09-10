export const YEAR_BUCKETS = [
  { id: "2000-2003", label: "2000–2003", min: 2000, max: 2003 },
  { id: "2004-2008", label: "2004–2008", min: 2004, max: 2008 },
  { id: "2009-2012", label: "2009–2012", min: 2009, max: 2012 },
  { id: "2013-2017", label: "2013–2017", min: 2013, max: 2017 },
];

export function yearBucketFor(year) {
  return (
    YEAR_BUCKETS.find((bucket) => year >= bucket.min && year <= bucket.max) ??
    YEAR_BUCKETS[YEAR_BUCKETS.length - 1]
  );
}

export function folderIdForFacet(kind, value) {
  if (value == null || value === "") return null;
  if (kind === "theme") return `theme:${value}`;
  if (kind === "type") return `type:${value}`;
  if (kind === "method") return `method:${value}`;
  if (kind === "year") {
    const bucket = yearBucketFor(value);
    return `year:${bucket.id}`;
  }
  return null;
}
