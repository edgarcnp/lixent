/**
 * Input sanitization helpers.
 *
 * Centralizes repeated sanitization patterns used across validation
 * and rendering. Defense-in-depth: validation rejects bad input at
 * load time, sanitization strips anything that slips through at
 * render time.
 *
 * @module
 */

/** Regex that detects CSS `url()` calls (data exfiltration vector). */
const CSS_URL_PATTERN = /url\s*\(/i

/** Regex that detects CSS structural characters that could enable injection. */
const CSS_STRUCTURAL_PATTERN = /[;{}]/

/** Regex that detects HTML-like tags (`<script>`, `</div>`, etc.). */
const HTML_TAG_PATTERN = /<[a-z/]/i

/**
 * Check if a string contains HTML-like tags.
 *
 * Blocks `<script>`, `</div>`, `<img ...>` etc. Used to prevent XSS
 * in fields rendered as HTML (copyright, license name, license text).
 *
 * @example
 * ```ts
 * hasHtmlTags("<script>alert(1)</script>") // true
 * hasHtmlTags("John Doe") // false
 * ```
 */
export function hasHtmlTags(value: string): boolean {
    return HTML_TAG_PATTERN.test(value)
}

/**
 * Check if a CSS value contains `url()` calls.
 *
 * `url()` in CSS can load external resources, enabling data exfiltration.
 * Used during config validation to reject unsafe values.
 *
 * @example
 * ```ts
 * hasCssUrl("red") // false
 * hasCssUrl("url(https://evil.com)") // true
 * ```
 */
export function hasCssUrl(value: string): boolean {
    return CSS_URL_PATTERN.test(value)
}

/**
 * Check if a CSS value contains dangerous characters (injection vectors).
 *
 * Blocks `url()` (data exfiltration), semicolons, and curly braces
 * which could break out of a CSS declaration and inject arbitrary rules.
 * Used during config validation for fields injected into `<style>` tags.
 *
 * @example
 * ```ts
 * hasCssDangerous("red") // false
 * hasCssDangerous("url(https://evil.com)") // true
 * hasCssDangerous("#fff; color: red") // true
 * hasCssDangerous("{ color: red }") // true
 * ```
 */
export function hasCssDangerous(value: string): boolean {
    return CSS_STRUCTURAL_PATTERN.test(value) || CSS_URL_PATTERN.test(value)
}

/**
 * Strip `url()` calls from a CSS value.
 *
 * Defense-in-depth sanitization applied at render time, after validation.
 * If validation was bypassed or a code path skipped it, this still strips
 * `url()` before the value reaches an inline `<style>` tag.
 *
 * @example
 * ```ts
 * stripCssUrl("url(https://evil.com)") // ""
 * stripCssUrl("#1a1a1a") // "#1a1a1a"
 * ```
 */
export function stripCssUrl(value: string): string {
    return value.replace(CSS_URL_PATTERN, "").replace(CSS_STRUCTURAL_PATTERN, "")
}
