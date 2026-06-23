export function formatYear(year?: number): string {
  return String(year ?? new Date().getFullYear());
}

export function formatYearRange(start: number, end: number): string {
  return `${start}–${end}`;
}
