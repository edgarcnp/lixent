/**
 * License text rendering.
 *
 * Replacement is done in a single pass with a callback, so values that look
 * like `String.prototype.replace` patterns (`$&`, `$'`, `$1`) are inserted
 * literally instead of being reinterpreted.
 *
 * @module
 */

import { toCanonicalPlaceholders } from "./placeholders.ts"

/** Values substituted into a license text. */
export interface LicenseValues {
    year: string
    name: string
    url?: string
    email?: string
}

const TOKEN_PATTERN = /\{\{(year|name|url|email)\}\}/g

/**
 * Converts SPDX placeholders and substitutes canonical tokens.
 *
 * Unknown `{{...}}` tokens are left untouched.
 */
export function renderLicenseText(text: string, values: LicenseValues): string {
    return toCanonicalPlaceholders(text).replace(TOKEN_PATTERN, (_match, token: string) => {
        return resolveToken(token, values)
    })
}

function resolveToken(token: string, values: LicenseValues): string {
    switch (token) {
        case "year":
            return values.year
        case "name":
            return values.name
        case "url":
            return values.url ?? ""
        case "email":
            return values.email ?? ""
        default:
            return ""
    }
}
