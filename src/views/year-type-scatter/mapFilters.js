export const MAP_SELECTION_SOURCE = "map";

export function uniqueMethods(allReports) {
  const counts = new Map();
  for (const report of allReports) {
    for (const method of report.methods) {
      counts.set(method, (counts.get(method) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

export function reportsMatchingMethods(allReports, selectedMethods) {
  if (selectedMethods.size === 0) return allReports;
  return allReports.filter((report) =>
    report.methods.some((method) => selectedMethods.has(method)),
  );
}

export function methodPillState(label, selected) {
  const pressed = selected.has(label);
  const inactive = selected.size > 0 && !pressed;
  return { pressed, inactive, hidden: false };
}

export function methodPillClassName({ pressed, inactive }) {
  return ["method-pill", pressed ? "is-selected" : "", inactive ? "is-inactive" : ""]
    .filter(Boolean)
    .join(" ");
}
