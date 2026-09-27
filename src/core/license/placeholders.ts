/**
 * SPDX placeholder conversion.
 *
 * SPDX license texts use several placeholder dialects (`<year>`, `[yyyy]`,
 * `<name of author>`, ...). Conversion normalizes them to the canonical
 * `{{year}}` / `{{name}}` tokens used by {@link renderLicenseText}.
 *
 * Angle brackets that do not match a known placeholder — URLs such as
 * `<https://gnu.org>`, or email addresses — are preserved.
 *
 * @module
 */

/** Canonical token replaced with the configured year. */
export const YEAR_TOKEN = "{{year}}"

/** Canonical token replaced with the configured copyright holder. */
export const NAME_TOKEN = "{{name}}"

interface PlaceholderRule {
    pattern: RegExp
    token: string
}

const PLACEHOLDER_RULES: readonly PlaceholderRule[] = [
    { pattern: /<year>/gi, token: YEAR_TOKEN },
    { pattern: /<copyright holders>/gi, token: NAME_TOKEN },
    { pattern: /<name of copyright holder>/gi, token: NAME_TOKEN },
    { pattern: /<name of author>/gi, token: NAME_TOKEN },
    { pattern: /<copyright holder>/gi, token: NAME_TOKEN },
    { pattern: /<program>/gi, token: NAME_TOKEN },
    { pattern: /<owner>/gi, token: NAME_TOKEN },
    { pattern: /\[yyyy\]/g, token: YEAR_TOKEN },
    { pattern: /\[year\]/g, token: YEAR_TOKEN },
    { pattern: /\[fullname\]/g, token: NAME_TOKEN },
    { pattern: /\[copyright holders\]/g, token: NAME_TOKEN },
    { pattern: /\[name of copyright owner\]/g, token: NAME_TOKEN },
]

/** Converts every known SPDX placeholder dialect to canonical tokens. */
export function toCanonicalPlaceholders(text: string): string {
    return PLACEHOLDER_RULES.reduce((result, rule) => result.replace(rule.pattern, rule.token), text)
}
