/**
 * Built-in theme catalog.
 *
 * Themes are data: each entry defines the six `--lx-*` CSS custom properties.
 * The page inlines them, so there are no per-theme CSS files to drift from.
 *
 * The set is curated for variety: warm paper, clean UI, Solarized, pastels,
 * monospace, brutalist, and several distinct dark palettes.
 *
 * @module
 */

export const THEME_VARIABLES = [
    "--lx-bg",
    "--lx-text",
    "--lx-text-muted",
    "--lx-accent",
    "--lx-divider",
    "--lx-font-body",
] as const

export type ThemeVariable = (typeof THEME_VARIABLES)[number]

/** Semantic color keys accepted in `theme.colors`. */
export const THEME_COLOR_KEYS = [
    "bg",
    "text",
    "textMuted",
    "accent",
    "border",
] as const

export type ThemeColorKey = (typeof THEME_COLOR_KEYS)[number]

/** Maps `theme.colors` keys to their CSS custom properties. */
export const THEME_COLOR_VARIABLES: Record<ThemeColorKey, ThemeVariable> = {
    bg: "--lx-bg",
    text: "--lx-text",
    textMuted: "--lx-text-muted",
    accent: "--lx-accent",
    border: "--lx-divider",
}

export interface ThemeDefinition {
    id: string
    name: string
    description: string
    dark: boolean
    vars: Record<ThemeVariable, string>
}

/** Default `theme.preset` when the config does not set one. */
export const DEFAULT_THEME_PRESET = "minimal"

export const BUILT_IN_THEMES: readonly ThemeDefinition[] = [
    {
        id: "minimal",
        name: "Minimal",
        description: "Warm paper with a classic serif",
        dark: false,
        vars: {
            "--lx-bg": "#faf9f7",
            "--lx-text": "#374151",
            "--lx-text-muted": "#6b7280",
            "--lx-accent": "#2563eb",
            "--lx-divider": "#d6d3cd",
            "--lx-font-body": "\"Georgia\", \"Times New Roman\", serif",
        },
    },
    {
        id: "minimal-dark",
        name: "Minimal Dark",
        description: "Warm dark with a classic serif",
        dark: true,
        vars: {
            "--lx-bg": "#1a1a1a",
            "--lx-text": "#e5e5e5",
            "--lx-text-muted": "#a3a3a3",
            "--lx-accent": "#60a5fa",
            "--lx-divider": "#404040",
            "--lx-font-body": "\"Georgia\", \"Times New Roman\", serif",
        },
    },
    {
        id: "github",
        name: "GitHub",
        description: "GitHub's light interface",
        dark: false,
        vars: {
            "--lx-bg": "#ffffff",
            "--lx-text": "#1f2328",
            "--lx-text-muted": "#656d76",
            "--lx-accent": "#0969da",
            "--lx-divider": "#d1d9e0",
            "--lx-font-body": "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Noto Sans\", Helvetica, Arial, sans-serif",
        },
    },
    {
        id: "github-dark",
        name: "GitHub Dark",
        description: "GitHub's dark interface",
        dark: true,
        vars: {
            "--lx-bg": "#0d1117",
            "--lx-text": "#e6edf3",
            "--lx-text-muted": "#8b949e",
            "--lx-accent": "#58a6ff",
            "--lx-divider": "#30363d",
            "--lx-font-body": "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Noto Sans\", Helvetica, Arial, sans-serif",
        },
    },
    {
        id: "solarized-light",
        name: "Solarized Light",
        description: "Schoonover's low-contrast palette",
        dark: false,
        vars: {
            "--lx-bg": "#fdf6e3",
            "--lx-text": "#586e75",
            "--lx-text-muted": "#93a1a1",
            "--lx-accent": "#268bd2",
            "--lx-divider": "#eee8d5",
            "--lx-font-body": "\"IBM Plex Sans\", system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif",
        },
    },
    {
        id: "solarized-dark",
        name: "Solarized Dark",
        description: "Schoonover's dark palette",
        dark: true,
        vars: {
            "--lx-bg": "#002b36",
            "--lx-text": "#93a1a1",
            "--lx-text-muted": "#657b83",
            "--lx-accent": "#268bd2",
            "--lx-divider": "#073642",
            "--lx-font-body": "\"IBM Plex Sans\", system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif",
        },
    },
    {
        id: "paper",
        name: "Paper",
        description: "Cream stock and rust ink",
        dark: false,
        vars: {
            "--lx-bg": "#f6f1e7",
            "--lx-text": "#3b352c",
            "--lx-text-muted": "#7a7061",
            "--lx-accent": "#b45309",
            "--lx-divider": "#e4dac7",
            "--lx-font-body": "\"Iowan Old Style\", \"Palatino Linotype\", Palatino, \"Book Antiqua\", Georgia, serif",
        },
    },
    {
        id: "blush",
        name: "Blush",
        description: "Soft rose with magenta accents",
        dark: false,
        vars: {
            "--lx-bg": "#fdf2f8",
            "--lx-text": "#831843",
            "--lx-text-muted": "#9d6c86",
            "--lx-accent": "#db2777",
            "--lx-divider": "#f5d0e3",
            "--lx-font-body": "\"Nunito\", ui-rounded, \"Segoe UI\", system-ui, sans-serif",
        },
    },
    {
        id: "sage",
        name: "Sage",
        description: "Muted botanical greens",
        dark: false,
        vars: {
            "--lx-bg": "#f3f6f1",
            "--lx-text": "#22392e",
            "--lx-text-muted": "#64816f",
            "--lx-accent": "#2f855a",
            "--lx-divider": "#d9e3db",
            "--lx-font-body": "\"Avenir Next\", Avenir, \"Segoe UI\", system-ui, sans-serif",
        },
    },
    {
        id: "blueprint",
        name: "Blueprint",
        description: "Technical blue with monospace",
        dark: false,
        vars: {
            "--lx-bg": "#eef4fb",
            "--lx-text": "#1e3a5f",
            "--lx-text-muted": "#5b7691",
            "--lx-accent": "#2563eb",
            "--lx-divider": "#d2e0ef",
            "--lx-font-body": "\"IBM Plex Mono\", ui-monospace, \"SF Mono\", Menlo, Consolas, monospace",
        },
    },
    {
        id: "brutalist",
        name: "Brutalist",
        description: "Stark black on white",
        dark: false,
        vars: {
            "--lx-bg": "#ffffff",
            "--lx-text": "#000000",
            "--lx-text-muted": "#555555",
            "--lx-accent": "#e11d48",
            "--lx-divider": "#000000",
            "--lx-font-body": "\"Helvetica Neue\", Helvetica, Arial, sans-serif",
        },
    },
    {
        id: "terminal",
        name: "Terminal",
        description: "Retro green on black",
        dark: true,
        vars: {
            "--lx-bg": "#0a0a0a",
            "--lx-text": "#33ff33",
            "--lx-text-muted": "#1a8c1a",
            "--lx-accent": "#33ff33",
            "--lx-divider": "#1a3a1a",
            "--lx-font-body": "\"IBM Plex Mono\", \"Courier New\", monospace",
        },
    },
    {
        id: "dracula",
        name: "Dracula",
        description: "Purple night with soft highlights",
        dark: true,
        vars: {
            "--lx-bg": "#282a36",
            "--lx-text": "#f8f8f2",
            "--lx-text-muted": "#8892c4",
            "--lx-accent": "#bd93f9",
            "--lx-divider": "#44475a",
            "--lx-font-body": "\"Fira Sans\", \"Trebuchet MS\", \"Segoe UI\", system-ui, sans-serif",
        },
    },
    {
        id: "nord",
        name: "Nord",
        description: "Arctic blue-grey calm",
        dark: true,
        vars: {
            "--lx-bg": "#2e3440",
            "--lx-text": "#d8dee9",
            "--lx-text-muted": "#81a1c1",
            "--lx-accent": "#88c0d0",
            "--lx-divider": "#3b4252",
            "--lx-font-body": "\"SF Pro Text\", -apple-system, \"Segoe UI\", system-ui, sans-serif",
        },
    },
    {
        id: "gruvbox-dark",
        name: "Gruvbox Dark",
        description: "Warm retro terminal",
        dark: true,
        vars: {
            "--lx-bg": "#282828",
            "--lx-text": "#ebdbb2",
            "--lx-text-muted": "#a89984",
            "--lx-accent": "#fabd2f",
            "--lx-divider": "#3c3836",
            "--lx-font-body": "\"JetBrains Mono\", \"IBM Plex Mono\", ui-monospace, monospace",
        },
    },
    {
        id: "ember",
        name: "Ember",
        description: "Charcoal and amber heat",
        dark: true,
        vars: {
            "--lx-bg": "#1c1512",
            "--lx-text": "#f2e4d5",
            "--lx-text-muted": "#ac9884",
            "--lx-accent": "#f59e0b",
            "--lx-divider": "#382a20",
            "--lx-font-body": "\"Charter\", \"Iowan Old Style\", Georgia, serif",
        },
    },
]

const THEME_MAP = new Map(BUILT_IN_THEMES.map((theme) => [theme.id, theme]))

export function getTheme(id: string): ThemeDefinition | undefined {
    return THEME_MAP.get(id)
}

export function isBuiltInTheme(id: string): boolean {
    return THEME_MAP.has(id)
}
