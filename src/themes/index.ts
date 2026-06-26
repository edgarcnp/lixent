/**
 * Theme registry and metadata.
 *
 * Themes are CSS files in `public/themes/` that define the 8 `--lx-*` CSS
 * custom properties. Each base theme has a dark and light variant.
 *
 * ## Adding a theme
 *
 * 1. Create `public/themes/{base}-dark.css` and `public/themes/{base}-light.css`
 *    defining all 8 variables.
 * 2. That's it — the registry is built automatically from the filesystem.
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
 * | `--lx-border` | Borders, dividers |
 * | `--lx-surface` | Card/panel backgrounds |
 *
 * @module
 */

import { readdirSync, readFileSync } from "node:fs"
import { join, basename } from "node:path"

/** Metadata for a single theme. */
export interface ThemeMeta {
    /** Unique identifier used in `lixent.config.json` (e.g. `"minimal-dark"`, `"github-light"`). */
    id: string
    /** Base theme name (e.g. `"minimal"`, `"github"`). */
    base: string
    /** Human-readable display name derived from the base. */
    name: string
    /** Whether this is a dark theme. */
    dark: boolean
    /** CSS variable names this theme defines. Always {@link THEME_VARIABLES}. */
    variables: string[]
    /** Preview colors parsed from the CSS file. */
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
    "--lx-border",
    "--lx-surface",
]

const THEMES_DIR = join(import.meta.dirname, "../../public/themes")

function parseCssVar(css: string, variable: string): string {
    const match = new RegExp(`${variable}:\\s*([^;]+)`).exec(css)
    return match?.[1]?.trim() ?? ""
}

function buildThemes(): ThemeMeta[] {
    const files = readdirSync(THEMES_DIR).filter((f) => f.endsWith(".css"))

    return files
        .map((file) => {
            const id = basename(file, ".css")
            const parts = id.split("-")
            const mode = parts.pop()
            if (mode !== "dark" && mode !== "light") return null

            const base = parts.join("-")
            const css = readFileSync(join(THEMES_DIR, file), "utf-8")

            return {
                id,
                base,
                name: base.charAt(0).toUpperCase() + base.slice(1),
                dark: mode === "dark",
                variables: THEME_VARIABLES,
                preview: {
                    bg: parseCssVar(css, "--lx-bg"),
                    accent: parseCssVar(css, "--lx-accent"),
                    text: parseCssVar(css, "--lx-text"),
                },
            }
        })
        .filter((t): t is ThemeMeta => t !== null)
        .sort((a, b) => a.base.localeCompare(b.base) || (a.dark ? 1 : 0) - (b.dark ? 1 : 0))
}

/**
 * Registry of all built-in themes, auto-generated from `public/themes/*.css`.
 */
export const themes: ThemeMeta[] = buildThemes()

/**
 * Find a theme by its ID.
 *
 * @param id - Theme identifier (e.g. `"minimal-dark"`, `"github-light"`).
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

/**
 * Get all unique base themes.
 *
 * @returns Array of base theme names.
 */
export function getBaseThemes(): string[] {
    return [...new Set(themes.map((t) => t.base))]
}

/**
 * Get the dark variant of a base theme.
 *
 * @param base - Base theme name (e.g. `"minimal"`).
 * @returns The dark theme metadata, or `undefined` if not found.
 */
export function getDarkTheme(base: string): ThemeMeta | undefined {
    return themes.find((t) => t.base === base && t.dark)
}

/**
 * Get the light variant of a base theme.
 *
 * @param base - Base theme name (e.g. `"minimal"`).
 * @returns The light theme metadata, or `undefined` if not found.
 */
export function getLightTheme(base: string): ThemeMeta | undefined {
    return themes.find((t) => t.base === base && !t.dark)
}
