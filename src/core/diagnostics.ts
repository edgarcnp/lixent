/**
 * Diagnostics and error types.
 *
 * Every user-facing failure throws {@link ConfigError} or {@link LicenseError}.
 * Config parsing collects every problem before throwing, so a single run
 * reports all mistakes instead of only the first.
 *
 * Messages on the thrown errors are prefixed with `[lixent]`; individual
 * diagnostic messages are not.
 *
 * @module
 */

/** Machine-readable codes for configuration problems. */
export type ConfigErrorCode
    = | "CONFIG_MISSING"
    | "CONFIG_PARSE"
    | "CONFIG_SHAPE"
    | "UNKNOWN_KEY"
    | "MISSING_FIELD"
    | "EMPTY_FIELD"
    | "INVALID_TYPE"
    | "INVALID_FORMAT"
    | "INVALID_VALUE"
    | "INVALID_PROTOCOL"
    | "TOO_LONG"
    | "OUT_OF_RANGE"
    | "MUTUALLY_EXCLUSIVE"
    | "HTML_TAGS"
    | "UNSAFE_VALUE"
    | "DISALLOWED_KEY"

/** A single configuration problem. */
export interface Diagnostic {
    code: ConfigErrorCode
    field?: string
    message: string
}

/** Builds a diagnostic, omitting `field` when it does not apply. */
export function diagnostic(code: ConfigErrorCode, field: string | undefined, message: string): Diagnostic {
    return field === undefined ? { code, message } : { code, field, message }
}

/** Thrown when configuration is missing, malformed, or invalid. */
export class ConfigError extends Error {
    override name = "ConfigError"
    readonly diagnostics: readonly Diagnostic[]

    constructor(diagnostics: readonly Diagnostic[]) {
        super(diagnostics.map((item) => `[lixent] ${item.message}`).join("\n"))
        this.diagnostics = diagnostics
    }
}

/** Machine-readable codes for license problems. */
export type LicenseErrorCode
    = | "INVALID_ID"
    | "FETCH_FAILED"
    | "NOT_FOUND"
    | "MISSING_TEXT"
    | "FILE_UNREADABLE"

/** Thrown when license text cannot be resolved. */
export class LicenseError extends Error {
    override name = "LicenseError"
    readonly code: LicenseErrorCode
    readonly licenseId?: string

    constructor(message: string, options: { code: LicenseErrorCode, licenseId?: string }) {
        super(`[lixent] ${message}`)
        this.code = options.code
        if (options.licenseId !== undefined) {
            this.licenseId = options.licenseId
        }
    }
}
