/**
 * Config type coercion.
 *
 * Handles common mistakes like `"year": "2024"` (string instead of number)
 * or `yearRange: { start: "2020", end: "2026" }` (strings instead of numbers).
 *
 * @module
 */

import type { LixentConfig } from "../types.ts"
import { ConfigError } from "../errors.ts"

function coerceYear(value: unknown, field: string): number {
    if (typeof value === "number") return value
    if (typeof value === "string") {
        const n = Number(value)
        if (!Number.isFinite(n)) {
            throw new ConfigError(`[lixent] ${field} must be a number, got "${value}"`)
        }
        return n
    }
    throw new ConfigError(`[lixent] ${field} must be a number, got ${String(value)}`)
}

/**
 * Coerce a raw parsed JSON value into a LixentConfig shape.
 *
 * @throws {ConfigError} If a string value cannot be converted to a number.
 */
export function coerceConfig(raw: Record<string, unknown>): LixentConfig {
    const year = raw.year != null ? coerceYear(raw.year, "year") : undefined

    let yearRange: LixentConfig["yearRange"]
    if (raw.yearRange != null && typeof raw.yearRange === "object") {
        const yr = raw.yearRange as Record<string, unknown>
        yearRange = {
            start: coerceYear(yr.start, "yearRange.start"),
            end: coerceYear(yr.end, "yearRange.end"),
        }
    }

    return {
        ...raw,
        year,
        yearRange,
    } as LixentConfig
}
