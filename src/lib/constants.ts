/**
 * Shared validation constants.
 *
 * Centralizes magic numbers, regex patterns, and allowlists used
 * across validators and rendering.
 *
 * @module
 */

/** Maximum byte length for the copyright field. */
export const MAX_COPYRIGHT_BYTES = 256

/** Maximum byte length for the font family value. */
export const MAX_FONT_BYTES = 128

/** Maximum byte length for custom license name. */
export const MAX_CUSTOM_NAME_BYTES = 256

/** Maximum byte length for custom license text (50 KB). */
export const MAX_CUSTOM_TEXT_BYTES = 50 * 1024

/** Only http and https protocols are allowed in URLs. */
export const ALLOWED_SCHEMES = ["http:", "https:"]

/** Pattern for safe CSS property values (letters, numbers, spaces, units, etc.). */
export const CSS_VALUE_PATTERN = /^[a-zA-Z0-9 .%,+\-/()]+$/

/** Allowed keys for `customTheme`. */
export const CUSTOM_THEME_KEYS = ["bg", "text", "textMuted", "accent", "border"] as const
