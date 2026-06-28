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

export interface ThemeMeta {
    id: string
    name: string
    description: string
    dark: boolean
    preview: { bg: string, accent: string, text: string }
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
export const themes: ThemeMeta[] = [
    {
        id: "minimal",
        name: "Minimal",
        description: "Clean serif theme with generous spacing",
        dark: false,
        preview: { bg: "#faf9f7", accent: "#2563eb", text: "#374151" },
    },
    {
        id: "minimal-dark",
        name: "Minimal Dark",
        description: "Same as minimal, dark background",
        dark: true,
        preview: { bg: "#1a1a1a", accent: "#60a5fa", text: "#e5e5e5" },
    },
    {
        id: "github",
        name: "GitHub",
        description: "GitHub README aesthetic",
        dark: false,
        preview: { bg: "#ffffff", accent: "#0969da", text: "#1f2328" },
    },
    {
        id: "github-dark",
        name: "GitHub Dark",
        description: "GitHub dark README",
        dark: true,
        preview: { bg: "#0d1117", accent: "#58a6ff", text: "#e6edf3" },
    },
    {
        id: "terminal",
        name: "Terminal",
        description: "Retro terminal, green-on-black",
        dark: true,
        preview: { bg: "#0a0a0a", accent: "#33ff33", text: "#33ff33" },
    },
    {
        id: "newspaper",
        name: "Newspaper",
        description: "NYT/journalism style",
        dark: false,
        preview: { bg: "#ffffff", accent: "#1a1a1a", text: "#1a1a1a" },
    },
    {
        id: "elegant",
        name: "Elegant",
        description: "High-contrast, refined",
        dark: false,
        preview: { bg: "#fafaf9", accent: "#b45309", text: "#1c1917" },
    },
    {
        id: "mono",
        name: "Mono",
        description: "Pure monospace, no decoration",
        dark: false,
        preview: { bg: "#ffffff", accent: "#171717", text: "#171717" },
    },
    {
        id: "serif",
        name: "Serif",
        description: "Traditional book-like",
        dark: false,
        preview: { bg: "#fffbf5", accent: "#92400e", text: "#292524" },
    },
    {
        id: "sans",
        name: "Sans",
        description: "Modern sans-serif",
        dark: false,
        preview: { bg: "#ffffff", accent: "#2563eb", text: "#18181b" },
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
 * @returns `true` if the ID is a built-in theme or the literal string `"custom"`.
 */
export function isValidTheme(id: string): boolean {
    return id === "custom" || THEME_MAP.has(id)
}
