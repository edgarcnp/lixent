/**
 * Year formatting utilities.
 *
 * Handles single years and year ranges (e.g. "2020–2026" with an en dash).
 *
 * @module
 */

/**
 * Format a year as a string. Defaults to the current year if not provided.
 *
 * @param year - Year to format. If omitted, uses `new Date().getFullYear()`.
 * @returns Year as a string (e.g. `"2026"`).
 */
export function formatYear(year?: number): string {
    return String(year ?? new Date().getFullYear())
}

/**
 * Format a year range with an en dash (U+2013).
 *
 * @param start - Start year.
 * @param end   - End year.
 * @returns Formatted range (e.g. `"2020–2026"`).
 */
export function formatYearRange(start: number, end: number): string {
    return `${start}–${end}`
}
