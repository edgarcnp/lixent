/**
 * Input validation for user-provided configuration values.
 *
 * All validators follow the `assert` pattern: they return `void` on success
 * and throw an `Error` with a descriptive message on failure. Empty strings
 * are treated as "not provided" and pass validation (except for required
 * fields like `customLicense.name`).
 *
 * ## Security model
 *
 * Lixent is a static site generator — there are no server-side endpoints,
 * forms, or user sessions. The attack surface is limited to:
 *
 * 1. **CSS injection** via `themeOverrides`, `font`, or custom CSS values.
 *    Mitigated by: `CSS_DANGEROUS_PATTERN` blocks `;{}` and `url()`.
 * 2. **XSS via copyright** — mitigated by blocking HTML tags.
 * 3. **URL scheme abuse** — mitigated by allowing only `http:` / `https:`.
 *
 * @module
 */

/** Maximum byte length for the copyright field. */
const MAX_COPYRIGHT_BYTES = 256
/** Maximum byte length for the font family value. */
const MAX_FONT_BYTES = 128
/** Maximum byte length for custom license name. */
const MAX_CUSTOM_NAME_BYTES = 256
/** Maximum byte length for custom license text (50 KB). */
const MAX_CUSTOM_TEXT_BYTES = 50 * 1024
/** Only http and https protocols are allowed in URLs. */
const ALLOWED_SCHEMES = ["http:", "https:"]

/**
 * Pattern that detects potentially dangerous CSS characters.
 * Blocks semicolons, curly braces, and `url()` function calls
 * which could be used for CSS injection.
 */
export const CSS_DANGEROUS_PATTERN = /[;{}]|url\s*\(/i

/**
 * Validate a URL string.
 *
 * Accepts empty strings (field is optional). Rejects non-HTTP(S) protocols
 * like `javascript:` or `data:` which could enable XSS.
 *
 * @throws {Error} If the URL is malformed or uses a disallowed protocol.
 */
export function assertValidUrl(raw: string): void {
    if (raw.length === 0) return
    let parsed: URL
    try {
        parsed = new URL(raw)
    } catch {
        throw new Error(`Invalid URL: ${raw}`)
    }
    if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
        throw new Error(`URL must use http: or https: protocol, got ${parsed.protocol}`)
    }
}

/**
 * Validate an email address format.
 *
 * Uses a deliberately loose regex — strict email validation isn't needed here,
 * just basic sanity checking.
 *
 * @throws {Error} If the email doesn't match the expected format.
 */
export function assertValidEmail(raw: string): void {
    if (raw.length === 0) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) || /[<>"]/.test(raw)) {
        throw new Error(`Invalid email: ${raw}`)
    }
}

/**
 * Validate a font family value.
 *
 * Checks length and blocks CSS injection patterns. Font values are injected
 * into a `<style>` tag, so they must not contain semicolons, braces, or `url()`.
 *
 * @throws {Error} If the value exceeds the max length or contains dangerous characters.
 */
export function assertValidFont(raw: string): void {
    if (raw.length === 0) return
    if (raw.length > MAX_FONT_BYTES) {
        throw new Error(`Font value exceeds ${MAX_FONT_BYTES} bytes`)
    }
    if (CSS_DANGEROUS_PATTERN.test(raw)) {
        throw new Error(`Font value contains unsafe characters: ${raw}`)
    }
}

/**
 * Validate the copyright field.
 *
 * Blocks HTML tags (e.g. `<script>`) to prevent XSS. The copyright string
 * is rendered as HTML in the output page, so HTML entities are escaped by
 * Astro, but raw tags must be blocked at the config level.
 *
 * @throws {Error} If the value exceeds the max length or contains HTML tags.
 */
export function assertValidCopyright(raw: string): void {
    if (raw.length > MAX_COPYRIGHT_BYTES) {
        throw new Error(`Copyright exceeds ${MAX_COPYRIGHT_BYTES} bytes`)
    }
    if (/<[a-z/]/i.test(raw)) {
        throw new Error(`Copyright contains HTML tags`)
    }
}

/**
 * Validate a year value.
 *
 * Must be a finite integer between 1900 and 2100.
 *
 * @throws {Error} If the year is not a finite integer or is out of range.
 */
export function assertValidYear(raw: number): void {
    if (!Number.isFinite(raw)) {
        throw new Error(`Year must be a finite number, got ${raw}`)
    }
    if (raw !== Math.floor(raw)) {
        throw new Error(`Year must be an integer, got ${raw}`)
    }
    if (raw < 1900 || raw > 2100) {
        throw new Error(`Year must be between 1900 and 2100, got ${raw}`)
    }
}

/**
 * Validate a custom license name.
 *
 * Cannot be empty (it's displayed as the license title), must not contain
 * HTML tags, and must not exceed the max length.
 *
 * @throws {Error} If the name is empty, too long, or contains HTML tags.
 */
export function assertValidCustomName(raw: string): void {
    if (raw.length === 0) {
        throw new Error("Custom license name cannot be empty")
    }
    if (raw.length > MAX_CUSTOM_NAME_BYTES) {
        throw new Error(`Custom license name exceeds ${MAX_CUSTOM_NAME_BYTES} bytes`)
    }
    if (/<[a-z/]/i.test(raw)) {
        throw new Error(`Custom license name contains HTML tags`)
    }
}

/**
 * Validate custom license text.
 *
 * Cannot be empty (it's the entire license body). Capped at 50 KB to prevent
 * excessively large pages. Blocks HTML tags as a defense-in-depth measure.
 *
 * @throws {Error} If the text is empty, exceeds the max length, or contains HTML tags.
 */
export function assertValidCustomText(raw: string): void {
    if (raw.length === 0) {
        throw new Error("Custom license text cannot be empty")
    }
    if (raw.length > MAX_CUSTOM_TEXT_BYTES) {
        throw new Error(`Custom license text exceeds ${MAX_CUSTOM_TEXT_BYTES} bytes`)
    }
    if (/<[a-z/]/i.test(raw)) {
        throw new Error("Custom license text contains HTML tags")
    }
}

/**
 * Validate theme overrides.
 *
 * Only allows CSS variables from the {@link THEME_VARIABLES} allowlist.
 * Values are checked for CSS injection patterns.
 *
 * @param overrides   - The user's theme override map.
 * @param allowedKeys - Allowlisted CSS variable names (from `THEME_VARIABLES`).
 * @throws {Error} If a disallowed variable is used or a value contains dangerous characters.
 */
export function assertValidThemeOverrides(
    overrides: Record<string, string>,
    allowedKeys: readonly string[],
): void {
    for (const [key, value] of Object.entries(overrides)) {
        if (!allowedKeys.includes(key)) {
            throw new Error(`Disallowed CSS variable in themeOverrides: ${key}`)
        }
        if (CSS_DANGEROUS_PATTERN.test(value)) {
            throw new Error(`Unsafe value in themeOverrides for ${key}: ${value}`)
        }
    }
}

/** Pattern for safe CSS property values (letters, numbers, spaces, units, etc.). */
const CSS_VALUE_PATTERN = /^[a-zA-Z0-9 .%,+\-/()]+$/

/**
 * Validate a generic CSS value (used for font-size, font-weight, etc.).
 *
 * Checks length, dangerous patterns, and character whitelist.
 *
 * @param value - The CSS value to validate.
 * @param field - Field name for error messages (e.g. `"fontSize"`).
 * @throws {Error} If the value is too long, contains dangerous characters, or fails the pattern check.
 */
export function assertValidCssValue(value: string, field: string): void {
    if (value.length === 0) return
    if (value.length > 64) {
        throw new Error(`${field} exceeds 64 characters`)
    }
    if (CSS_DANGEROUS_PATTERN.test(value)) {
        throw new Error(`${field} contains unsafe characters`)
    }
    if (!CSS_VALUE_PATTERN.test(value)) {
        throw new Error(`${field} contains invalid characters`)
    }
}
