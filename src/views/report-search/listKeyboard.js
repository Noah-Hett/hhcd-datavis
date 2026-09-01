export function stepActive(current, key, length) {
  if (!length) return 0;
  if (key === "ArrowDown") return Math.min(length - 1, current + 1);
  if (key === "ArrowUp") return Math.max(0, current - 1);
  if (key === "Home") return 0;
  if (key === "End") return length - 1;
  return current;
}
