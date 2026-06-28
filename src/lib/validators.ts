/**
 * Input validators for user-provided configuration values.
 *
 * All validators follow the `assert` pattern: they return `void` on success
 * and throw a {@link ConfigError} with a descriptive message on failure. Empty strings
 * are treated as "not provided" and pass validation (except for required
 * fields like `copyright`, `customLicense.name`, and `customLicense.text`).
 *
 * ## Security model
 *
 * Lixent is a static site generator — there are no server-side endpoints,
 * forms, or user sessions. The attack surface is limited to:
 *
 * 1. **CSS injection** via `themeOverrides`, `font`, or custom CSS values.
 *    Mitigated by: `hasCssUrl()` blocks `url()` which could exfiltrate data.
 * 2. **XSS via copyright** — mitigated by blocking HTML tags.
 * 3. **URL scheme abuse** — mitigated by allowing only `http:` / `https:`.
 *
 * @module
 */

import { ConfigError } from "./errors.ts"
import { hasCssUrl, hasHtmlTags } from "./sanitize.ts"
import {
    MAX_COPYRIGHT_BYTES,
    MAX_FONT_BYTES,
    MAX_CUSTOM_NAME_BYTES,
    MAX_CUSTOM_TEXT_BYTES,
    ALLOWED_SCHEMES,
    CSS_VALUE_PATTERN,
    CUSTOM_THEME_KEYS,
} from "./constants.ts"

/**
 * Validate a URL string.
 *
 * Accepts empty strings (field is optional). Rejects non-HTTP(S) protocols
 * like `javascript:` or `data:` which could enable XSS.
 *
 * @throws {ConfigError} If the URL is malformed or uses a disallowed protocol.
 */
export function assertValidUrl(raw: string): void {
    if (raw.length === 0) return
    let parsed: URL
    try {
        parsed = new URL(raw)
    } catch {
        throw new ConfigError(
            `[lixent] Invalid URL: ${raw}`,
            { code: "INVALID_FORMAT", field: "url" },
        )
    }
    if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
        throw new ConfigError(
            `[lixent] URL must use http: or https: protocol, got ${parsed.protocol}`,
            { code: "INVALID_PROTOCOL", field: "url" },
        )
    }
}

/**
 * Validate an email address format.
 *
 * Uses a deliberately loose regex — strict email validation isn't needed here,
 * just basic sanity checking.
 *
 * @throws {ConfigError} If the email doesn't match the expected format.
 */
export function assertValidEmail(raw: string): void {
    if (raw.length === 0) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) || /[<>"]/.test(raw)) {
        throw new ConfigError(
            `[lixent] Invalid email: ${raw}`,
            { code: "INVALID_FORMAT", field: "email" },
        )
    }
}

/**
 * Validate a font family value.
 *
 * Checks length and blocks `url()` patterns. Font values are injected
 * into a `<style>` tag, so they must not contain `url()` which could exfiltrate data.
 *
 * @throws {ConfigError} If the value exceeds the max length or contains dangerous characters.
 */
export function assertValidFont(raw: string): void {
    if (raw.length === 0) return
    if (raw.length > MAX_FONT_BYTES) {
        throw new ConfigError(
            `[lixent] Font value exceeds ${MAX_FONT_BYTES} bytes`,
            { code: "TOO_LONG", field: "font" },
        )
    }
    if (hasCssUrl(raw)) {
        throw new ConfigError(
            `[lixent] Font value contains unsafe characters: ${raw}`,
            { code: "UNSAFE_VALUE", field: "font" },
        )
    }
}

/**
 * Validate the copyright field.
 *
 * Blocks HTML tags (e.g. `<script>`) to prevent XSS. The copyright string
 * is rendered as HTML in the output page, so HTML entities are escaped by
 * Astro, but raw tags must be blocked at the config level.
 *
 * @throws {ConfigError} If the value exceeds the max length or contains HTML tags.
 */
export function assertValidCopyright(raw: string): void {
    if (raw.length === 0) {
        throw new ConfigError(
            "[lixent] Copyright cannot be empty",
            { code: "EMPTY_FIELD", field: "copyright" },
        )
    }
    if (raw.length > MAX_COPYRIGHT_BYTES) {
        throw new ConfigError(
            `[lixent] Copyright exceeds ${MAX_COPYRIGHT_BYTES} bytes`,
            { code: "TOO_LONG", field: "copyright" },
        )
    }
    if (hasHtmlTags(raw)) {
        throw new ConfigError(
            "[lixent] Copyright contains HTML tags",
            { code: "HTML_TAGS", field: "copyright" },
        )
    }
}

/**
 * Validate a year value.
 *
 * Must be a finite integer between 1900 and 2100.
 *
 * @throws {ConfigError} If the year is not a finite integer or is out of range.
 */
export function assertValidYear(raw: number): void {
    if (!Number.isFinite(raw)) {
        throw new ConfigError(
            `[lixent] Year must be a finite number, got ${raw}`,
            { code: "INVALID_TYPE", field: "year" },
        )
    }
    if (raw !== Math.floor(raw)) {
        throw new ConfigError(
            `[lixent] Year must be an integer, got ${raw}`,
            { code: "INVALID_TYPE", field: "year" },
        )
    }
    if (raw < 1900 || raw > 2100) {
        throw new ConfigError(
            `[lixent] Year must be between 1900 and 2100, got ${raw}`,
            { code: "OUT_OF_RANGE", field: "year" },
        )
    }
}

/**
 * Validate a custom license name.
 *
 * Cannot be empty (it's displayed as the license title), must not contain
 * HTML tags, and must not exceed the max length.
 *
 * @throws {ConfigError} If the name is empty, too long, or contains HTML tags.
 */
export function assertValidCustomName(raw: string): void {
    if (raw.length === 0) {
        throw new ConfigError(
            "[lixent] Custom license name cannot be empty",
            { code: "EMPTY_FIELD", field: "customLicense.name" },
        )
    }
    if (raw.length > MAX_CUSTOM_NAME_BYTES) {
        throw new ConfigError(
            `[lixent] Custom license name exceeds ${MAX_CUSTOM_NAME_BYTES} bytes`,
            { code: "TOO_LONG", field: "customLicense.name" },
        )
    }
    if (hasHtmlTags(raw)) {
        throw new ConfigError(
            "[lixent] Custom license name contains HTML tags",
            { code: "HTML_TAGS", field: "customLicense.name" },
        )
    }
}

/**
 * Validate custom license text.
 *
 * Cannot be empty (it's the entire license body). Capped at 50 KB to prevent
 * excessively large pages. Blocks HTML tags as a defense-in-depth measure.
 *
 * @throws {ConfigError} If the text is empty, exceeds the max length, or contains HTML tags.
 */
export function assertValidCustomText(raw: string): void {
    if (raw.length === 0) {
        throw new ConfigError(
            "[lixent] Custom license text cannot be empty",
            { code: "EMPTY_FIELD", field: "customLicense.text" },
        )
    }
    if (raw.length > MAX_CUSTOM_TEXT_BYTES) {
        throw new ConfigError(
            `[lixent] Custom license text exceeds ${MAX_CUSTOM_TEXT_BYTES} bytes`,
            { code: "TOO_LONG", field: "customLicense.text" },
        )
    }
    if (hasHtmlTags(raw)) {
        throw new ConfigError(
            "[lixent] Custom license text contains HTML tags",
            { code: "HTML_TAGS", field: "customLicense.text" },
        )
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
 * @throws {ConfigError} If a disallowed variable is used or a value contains dangerous characters.
 */
export function assertValidThemeOverrides(
    overrides: Record<string, string>,
    allowedKeys: readonly string[],
): void {
    for (const [key, value] of Object.entries(overrides)) {
        if (!allowedKeys.includes(key)) {
            throw new ConfigError(
                `[lixent] Disallowed CSS variable in themeOverrides: ${key}`,
                { code: "DISALLOWED_VAR", field: `themeOverrides.${key}` },
            )
        }
        if (value.length === 0) {
            throw new ConfigError(
                `[lixent] Empty value for ${key} in themeOverrides`,
                { code: "EMPTY_FIELD", field: `themeOverrides.${key}` },
            )
        }
        if (hasCssUrl(value)) {
            throw new ConfigError(
                `[lixent] Unsafe value in themeOverrides for ${key}: ${value}`,
                { code: "UNSAFE_VALUE", field: `themeOverrides.${key}` },
            )
        }
    }
}

/**
 * Validate a generic CSS value (used for font-size, font-weight, etc.).
 *
 * Checks length, dangerous patterns, and character whitelist.
 *
 * @param value - The CSS value to validate.
 * @param field - Field name for error messages (e.g. `"fontSize"`).
 * @throws {ConfigError} If the value is too long, contains dangerous characters, or fails the pattern check.
 */
export function assertValidCssValue(value: string, field: string): void {
    if (value.length === 0) return
    if (value.length > 64) {
        throw new ConfigError(
            `[lixent] ${field} exceeds 64 characters`,
            { code: "TOO_LONG", field },
        )
    }
    if (hasCssUrl(value)) {
        throw new ConfigError(
            `[lixent] ${field} contains unsafe characters`,
            { code: "UNSAFE_VALUE", field },
        )
    }
    if (!CSS_VALUE_PATTERN.test(value)) {
        throw new ConfigError(
            `[lixent] ${field} contains invalid characters`,
            { code: "INVALID_CHARS", field },
        )
    }
}

/**
 * Validate a custom theme object.
 *
 * Only allows the 5 predefined color keys. Values are checked for
 * CSS injection patterns and must not exceed 64 characters.
 *
 * @param customTheme - The user's custom theme object.
 * @throws {ConfigError} If a disallowed key is used or a value contains dangerous characters.
 */
export function assertValidCustomTheme(
    customTheme: Record<string, string>,
): void {
    for (const key of Object.keys(customTheme)) {
        if (!(CUSTOM_THEME_KEYS as readonly string[]).includes(key)) {
            throw new ConfigError(
                `[lixent] Disallowed key in customTheme: "${key}". Allowed: ${CUSTOM_THEME_KEYS.join(", ")}`,
                { code: "DISALLOWED_KEY", field: `customTheme.${key}` },
            )
        }
    }
    for (const [key, value] of Object.entries(customTheme)) {
        if (typeof value !== "string" || value.length === 0) {
            throw new ConfigError(
                `[lixent] customTheme.${key} must be a non-empty string`,
                { code: "EMPTY_FIELD", field: `customTheme.${key}` },
            )
        }
        if (value.length > 64) {
            throw new ConfigError(
                `[lixent] customTheme.${key} exceeds 64 characters`,
                { code: "TOO_LONG", field: `customTheme.${key}` },
            )
        }
        if (hasCssUrl(value)) {
            throw new ConfigError(
                `[lixent] customTheme.${key} contains unsafe characters: ${value}`,
                { code: "UNSAFE_VALUE", field: `customTheme.${key}` },
            )
        }
    }
}
