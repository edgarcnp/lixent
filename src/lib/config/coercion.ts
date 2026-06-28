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

/**
 * Coerce a raw parsed JSON value into a LixentConfig shape.
 *
 * @throws {Error} If a string value cannot be converted to a number.
 */
export function coerceConfig(raw: Record<string, unknown>): LixentConfig {
    const config = { ...raw } as unknown as LixentConfig
    if (typeof raw.year === "string") {
        const n = Number(raw.year)
        if (!Number.isFinite(n)) {
            throw new ConfigError(`[lixent] year must be a number, got "${raw.year}"`)
        }
        config.year = n
    }
    if (raw.yearRange != null && typeof raw.yearRange === "object") {
        const yr = raw.yearRange as Record<string, unknown>
        if (typeof yr.start === "string") {
            const n = Number(yr.start)
            if (!Number.isFinite(n)) {
                throw new ConfigError(`[lixent] yearRange.start must be a number, got "${yr.start}"`)
            }
            ;(config.yearRange as Record<string, unknown>).start = n
        }
        if (typeof yr.end === "string") {
            const n = Number(yr.end)
            if (!Number.isFinite(n)) {
                throw new ConfigError(`[lixent] yearRange.end must be a number, got "${yr.end}"`)
            }
            ;(config.yearRange as Record<string, unknown>).end = n
        }
    }
    return config
}
