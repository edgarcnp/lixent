/**
 * Theme registry and metadata.
 *
 * Themes are CSS files in `public/themes/` that define the 8 `--lx-*` CSS
 * custom properties. This module provides the metadata (id, name, description,
 * dark mode flag) used by the demo dropdown and config validation.
 *
 * ## Adding a theme
 *
 * 1. Create `public/themes/my-theme.css` defining all 8 variables.
 * 2. Add an entry to the {@link themes} array here.
 * 3. Reference it as `"theme": "my-theme"` in `lixent.config.json`.
 *
 * ## CSS variables
 *
 * Every theme must define these 8 variables (see {@link THEME_VARIABLES}):
 *
 * | Variable | Purpose |
 * |----------|---------|
 * | `--lx-bg` | Page background |
 * | `--lx-text` | Primary text color |
 * | `--lx-text-muted` | Secondary/muted text |
 * | `--lx-accent` | Links, highlights |
 * | `--lx-border` | Borders, dividers |
 * | `--lx-surface` | Card/panel backgrounds |
 * | `--lx-font-body` | Body font family |
 * | `--lx-font-mono` | Monospace font family |
 *
 * @module
 */

/** Metadata for a single theme. */
export interface ThemeMeta {
    /** Unique identifier used in `lixent.config.json` (e.g. `"minimal"`, `"github-dark"`). */
    id: string
    /** Human-readable display name. */
    name: string
    /** Short description for the theme picker. */
    description: string
    /** Whether this is a dark theme (used for UI hints in the demo). */
    dark: boolean
    /** CSS variable names this theme defines. Always {@link THEME_VARIABLES}. */
    variables: string[]
}

/**
 * The 8 CSS custom properties every theme must define.
 * Used as the allowlist for `themeOverrides` validation.
 */
export const THEME_VARIABLES = [
    "--lx-bg",
    "--lx-text",
    "--lx-text-muted",
    "--lx-accent",
    "--lx-border",
    "--lx-surface",
    "--lx-font-body",
    "--lx-font-mono",
]

/**
 * Registry of all built-in themes.
 * Each entry maps to a CSS file in `public/themes/{id}.css`.
 */
export const themes: ThemeMeta[] = [
    {
        id: "minimal",
        name: "Minimal",
        description: "Clean serif theme with generous spacing",
        dark: false,
        variables: THEME_VARIABLES,
    },
    {
        id: "minimal-dark",
        name: "Minimal Dark",
        description: "Same as minimal, dark background",
        dark: true,
        variables: THEME_VARIABLES,
    },
    {
        id: "github",
        name: "GitHub",
        description: "GitHub README aesthetic",
        dark: false,
        variables: THEME_VARIABLES,
    },
    {
        id: "github-dark",
        name: "GitHub Dark",
        description: "GitHub dark README",
        dark: true,
        variables: THEME_VARIABLES,
    },
    {
        id: "terminal",
        name: "Terminal",
        description: "Retro terminal, green-on-black",
        dark: true,
        variables: THEME_VARIABLES,
    },
    {
        id: "newspaper",
        name: "Newspaper",
        description: "NYT/journalism style",
        dark: false,
        variables: THEME_VARIABLES,
    },
    {
        id: "elegant",
        name: "Elegant",
        description: "High-contrast, refined",
        dark: false,
        variables: THEME_VARIABLES,
    },
    {
        id: "mono",
        name: "Mono",
        description: "Pure monospace, no decoration",
        dark: false,
        variables: THEME_VARIABLES,
    },
    {
        id: "serif",
        name: "Serif",
        description: "Traditional book-like",
        dark: false,
        variables: THEME_VARIABLES,
    },
    {
        id: "sans",
        name: "Sans",
        description: "Modern sans-serif",
        dark: false,
        variables: THEME_VARIABLES,
    },
]

/**
 * Find a theme by its ID.
 *
 * @param id - Theme identifier (e.g. `"minimal"`, `"github-dark"`).
 * @returns The theme metadata, or `undefined` if not found.
 */
export function getTheme(id: string): ThemeMeta | undefined {
    return themes.find((t) => t.id === id)
}

/**
 * Check if a theme ID is valid.
 *
 * @param id - Theme identifier to check.
 * @returns `true` if the ID exists in the theme registry.
 */
export function isValidTheme(id: string): boolean {
    return themes.some((t) => t.id === id)
}
