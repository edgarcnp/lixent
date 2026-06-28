/**
 * Custom error classes for typed error handling.
 *
 * @module
 */

/** Thrown when config validation or loading fails. */
export class ConfigError extends Error {
    override name = "ConfigError"
}

/** Thrown when license fetching or resolution fails. */
export class LicenseError extends Error {
    override name = "LicenseError"
}
