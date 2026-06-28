/**
 * Custom error classes for typed error handling.
 *
 * All user-facing errors in Lixent throw either {@link ConfigError} or
 * {@link LicenseError}. Each carries a machine-readable `code` for
 * programmatic handling and an optional `field` / `licenseId` for
 * pinpointing the problem.
 *
 * ## Error hierarchy
 *
 * - `ConfigError` — validation, coercion, or config loading failures
 * - `LicenseError` — license fetching or resolution failures
 *
 * @module
 */

/** Thrown when config validation or loading fails. */
export class ConfigError extends Error {
    override name = "ConfigError"
    /** Machine-readable error code (e.g. `"EMPTY_FIELD"`, `"INVALID_FORMAT"`). */
    readonly code: string
    /** Config field that caused the error (e.g. `"copyright"`, `"year"`). */
    readonly field?: string

    constructor(message: string, opts?: { code?: string, field?: string }) {
        super(message)
        this.code = opts?.code ?? "UNKNOWN"
        this.field = opts?.field
    }
}

/** Thrown when license fetching or resolution fails. */
export class LicenseError extends Error {
    override name = "LicenseError"
    /** Machine-readable error code (e.g. `"FETCH_FAILED"`, `"NOT_FOUND"`). */
    readonly code: string
    /** SPDX license ID that caused the error (e.g. `"MIT"`). */
    readonly licenseId?: string

    constructor(message: string, opts?: { code?: string, licenseId?: string }) {
        super(message)
        this.code = opts?.code ?? "UNKNOWN"
        this.licenseId = opts?.licenseId
    }
}
