/**
 * Year formatting.
 *
 * @module
 */

/**
 * Formats a year, defaulting to the current year.
 *
 * Callers that need determinism (builds, tests) pass an explicit year rather
 * than relying on the clock.
 */
export function formatYear(year?: number): string {
    return String(year ?? new Date().getFullYear())
}

/** Formats a year range with an en dash (U+2013). */
export function formatYearRange(start: number, end: number): string {
    return `${start}–${end}`
}
