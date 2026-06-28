/**
 * Central type definitions for Lixent.
 *
 * This file defines the shape of `lixent.config.json` — the single source of
 * truth for a user's license page. Every field maps directly to a config key.
 *
 * @module
 */

/**
 * User-facing configuration for a Lixent license page.
 *
 * Loaded from `lixent.config.json` (preferred) or the `"lixent"` field in
 * `package.json`. Validated at build time by {@link loadConfig}.
 *
 * @example
 * ```json
 * {
 *   "copyright": "Jane Doe",
 *   "license": "MIT",
 *   "theme": "minimal",
 *   "font": "Inter",
 *   "fontSize": "1.125rem",
 *   "gravatar": true
 * }
 * ```
 */
export interface LixentConfig {
    /** Your name or organization. Displayed in the copyright line. Required. */
    copyright: string

    /** Your website URL. Rendered as a clickable link next to your name. */
    url?: string

    /** Email address. Used for Gravatar lookup (if `gravatar` is true) and rendered as a mailto link. */
    email?: string

    /**
     * SPDX license ID (e.g. `"MIT"`, `"Apache-2.0"`, `"GPL-3.0-only"`),
     * or `"custom"` to use `customLicense.text` or `licenseFile` instead.
     * Validated against the live SPDX list at build time.
     */
    license: string

    /** Custom license configuration. Only used when `license` is `"custom"`. */
    customLicense?: {
        /** Display name for the custom license (e.g. "My Custom License"). */
        name: string
        /** Full license text. Supports placeholders: `{{year}}`, `{{name}}`, `{{url}}`, `{{email}}`. */
        text?: string
    }

    /** Path to a license text file (relative to project root). Only used when `license` is `"custom"`. Supports placeholders. */
    licenseFile?: string

    /** Theme ID (e.g. `"minimal"`, `"github-dark"`), `"custom"` for inline colors, or a path to a custom CSS file. */
    theme: string

    /** Inline custom theme colors. Only used when `theme` is `"custom"`. */
    customTheme?: {
        /** Page background color (e.g. `"#1a1a1a"`). */
        bg: string
        /** Primary text color (e.g. `"#e5e5e5"`). */
        text: string
        /** Secondary/muted text color (e.g. `"#a3a3a3"`). */
        textMuted: string
        /** Links and highlights color (e.g. `"#60a5fa"`). */
        accent: string
        /** Borders and dividers color (e.g. `"#404040"`). */
        border: string
    }

    /**
     * Override any of the 6 theme CSS variables without creating a full theme.
     *
     * Allowed keys: `--lx-bg`, `--lx-text`, `--lx-text-muted`, `--lx-accent`,
     * `--lx-divider`, `--lx-font-body`.
     */
    themeOverrides?: Record<string, string>

    /** Google Fonts family name (e.g. `"Inter"`, `"Merriweather"`). Injected via `<link>` tag. */
    font?: string

    /** CSS font-size value (e.g. `"1.125rem"`, `"18px"`). Overrides `--lx-font-size`. */
    fontSize?: string

    /** CSS font-weight value (e.g. `"400"`, `"700"`). Applied to the body. */
    fontWeight?: string

    /** CSS line-height value (e.g. `"1.7"`, `"1.5"`). Overrides `--lx-line-height`. */
    lineHeight?: string

    /** CSS letter-spacing value (e.g. `"0.025em"`). Applied to the body. */
    letterSpacing?: string

    /** Show a Gravatar avatar next to the copyright line. Requires `email` to be set. */
    gravatar?: boolean

    /** Base path for subpath deploys (e.g. `"/license"`). Passed to Astro's `base` option. */
    basePath?: string

    /** Override the copyright year. Defaults to the current year. */
    year?: number

    /** Use a year range (e.g. `{ "start": 2020, "end": 2026 }`) instead of a single year. */
    yearRange?: { start: number, end: number }
}
