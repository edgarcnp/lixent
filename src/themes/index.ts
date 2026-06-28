/**
 * Theme registry and metadata.
 *
 * Themes are CSS files in `public/themes/` that define the 6 `--lx-*` CSS
 * custom properties. This module provides the metadata (id, name, description,
 * dark mode flag) used by the demo dropdown and config validation.
 *
 * ## Adding a theme
 *
 * 1. Create `public/themes/my-theme.css` defining all 6 variables.
 * 2. Add an entry to the {@link themes} array here.
 * 3. Reference it as `"theme": "my-theme"` in `lixent.config.json`.
 *
 * ## CSS variables
 *
 * Every theme must define these 6 variables (see {@link THEME_VARIABLES}):
 *
 * | Variable | Purpose |
 * |----------|---------|
 * | `--lx-bg` | Page background |
 * | `--lx-text` | Primary text color |
 * | `--lx-text-muted` | Secondary/muted text |
 * | `--lx-accent` | Links, highlights |
 * | `--lx-divider` | Dividers/separator lines |
 * | `--lx-font-body` | Body font family |
 *
 * @module
 */

interface ThemeMeta {
    id: string
    name: string
    description: string
    dark: boolean
}

/**
 * The 6 CSS custom properties every theme must define.
 * Used as the allowlist for `themeOverrides` validation.
 */
export const THEME_VARIABLES = [
    "--lx-bg",
    "--lx-text",
    "--lx-text-muted",
    "--lx-accent",
    "--lx-divider",
    "--lx-font-body",
]

/**
 * Registry of all built-in themes.
 * Each entry maps to a CSS file in `public/themes/{id}.css`.
 */
const themes: ThemeMeta[] = [
    {
        id: "minimal",
        name: "Minimal",
        description: "Clean serif theme with generous spacing",
        dark: false,
    },
    {
        id: "minimal-dark",
        name: "Minimal Dark",
        description: "Same as minimal, dark background",
        dark: true,
    },
    {
        id: "github",
        name: "GitHub",
        description: "GitHub README aesthetic",
        dark: false,
    },
    {
        id: "github-dark",
        name: "GitHub Dark",
        description: "GitHub dark README",
        dark: true,
    },
    {
        id: "terminal",
        name: "Terminal",
        description: "Retro terminal, green-on-black",
        dark: true,
    },
    {
        id: "newspaper",
        name: "Newspaper",
        description: "NYT/journalism style",
        dark: false,
    },
    {
        id: "elegant",
        name: "Elegant",
        description: "High-contrast, refined",
        dark: false,
    },
    {
        id: "mono",
        name: "Mono",
        description: "Pure monospace, no decoration",
        dark: false,
    },
    {
        id: "serif",
        name: "Serif",
        description: "Traditional book-like",
        dark: false,
    },
    {
        id: "sans",
        name: "Sans",
        description: "Modern sans-serif",
        dark: false,
    },
]

const THEME_MAP = new Map(themes.map((t) => [t.id, t]))

/**
 * Find a theme by its ID.
 *
 * @param id - Theme identifier (e.g. `"minimal"`, `"github-dark"`).
 * @returns The theme metadata, or `undefined` if not found.
 */
export function getTheme(id: string): ThemeMeta | undefined {
    return THEME_MAP.get(id)
}

/**
 * Check if a theme ID is valid.
 *
 * @param id - Theme identifier to check.
 * @returns `true` if the ID exists in the theme registry.
 */
export function isValidTheme(id: string): boolean {
    return id === "custom" || THEME_MAP.has(id)
}
