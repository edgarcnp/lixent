/**
 * Configuration types.
 *
 * {@link LixentConfig} is the parsed, validated configuration — the single
 * source of truth for what a license page can express. Raw JSON is turned
 * into this shape by `parseConfig()`; unknown keys never survive parsing.
 *
 * @module
 */

/** Semantic color overrides applied on top of a theme preset. */
export interface ThemeColors {
    bg?: string
    text?: string
    textMuted?: string
    accent?: string
    border?: string
}

/** Styling configuration: preset, colors, and typography. */
export interface ThemeConfig {
    /** Built-in theme id, or an absolute path to a CSS file (e.g. `"/my-theme.css"`). */
    preset: string
    colors?: ThemeColors
    /** Google Fonts family name. */
    font?: string
    fontSize?: string
    fontWeight?: string
    lineHeight?: string
    letterSpacing?: string
}

/** Inline custom license metadata and text. */
export interface CustomLicenseConfig {
    /** Display name. Defaults to `"Custom License"` when omitted. */
    name?: string
    /** License body. Supports `{{year}}`, `{{name}}`, `{{url}}`, and `{{email}}`. */
    text?: string
}

/** A fully parsed and validated Lixent configuration. */
export interface LixentConfig {
    copyright: string
    url?: string
    email?: string
    gravatar: boolean
    /** SPDX license id, or `"custom"`. */
    license: string
    customLicense?: CustomLicenseConfig
    /** Path to a license text file, relative to the project root. */
    licenseFile?: string
    /** Single copyright year. Mutually exclusive with `yearRange`. */
    year?: number
    /** Copyright year range. Mutually exclusive with `year`. */
    yearRange?: { start: number, end: number }
    /** Base path for subpath deploys (e.g. `"/license"`). */
    basePath?: string
    theme: ThemeConfig
}
