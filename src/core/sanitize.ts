/**
 * Sanitization helpers.
 *
 * Validation rejects dangerous values at config load time. These helpers are
 * the render-time safety net that neutralizes anything that still reaches a
 * `<style>` block.
 *
 * @module
 */

const CSS_URL_PATTERN = /url\s*\(/i
const CSS_STRUCTURAL_PATTERN = /[;{}]/
const HTML_TAG_PATTERN = /<[a-z/]/i

/** True when the value contains an HTML-like tag (`<script>`, `</div>`, ...). */
export function hasHtmlTags(value: string): boolean {
    return HTML_TAG_PATTERN.test(value)
}

/** True when the value contains a CSS `url()` call. */
export function hasCssUrl(value: string): boolean {
    return CSS_URL_PATTERN.test(value)
}

/** True when the value contains `url()`, `;`, `{`, or `}`. */
export function hasCssDangerous(value: string): boolean {
    return CSS_STRUCTURAL_PATTERN.test(value) || CSS_URL_PATTERN.test(value)
}

/** Strips `url()` calls and CSS structural characters from a value. */
export function stripCssUrl(value: string): string {
    return value.replace(/url\s*\(/gi, "").replace(/[;{}]/g, "")
}
