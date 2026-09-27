/**
 * SPDX license id grammar.
 *
 * Shared by config validation and license resolution so both agree on what a
 * fetchable license id looks like before any network request is made.
 *
 * @module
 */

const LICENSE_ID_PATTERN = /^[A-Za-z0-9.+-]+$/

/** True when the value is a syntactically valid SPDX license id. */
export function isValidLicenseId(value: string): boolean {
    return LICENSE_ID_PATTERN.test(value)
}
