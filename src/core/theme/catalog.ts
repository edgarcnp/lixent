/**
 * Built-in theme catalog.
 *
 * Themes are data: each entry defines the six `--lx-*` CSS custom properties.
 * The page inlines them, so there are no per-theme CSS files to drift from.
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
        description: "Clean serif theme with generous spacing",
        dark: false,
        vars: {
            "--lx-bg": "#faf9f7",
            "--lx-text": "#374151",
            "--lx-text-muted": "#6b7280",
            "--lx-accent": "#2563eb",
            "--lx-divider": "#d6d3cd",
            "--lx-font-body": "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
        },
    },
    {
        id: "minimal-dark",
        name: "Minimal Dark",
        description: "Same as minimal, dark background",
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
        description: "GitHub README aesthetic",
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
        description: "GitHub dark README",
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
        id: "terminal",
        name: "Terminal",
        description: "Retro terminal, green-on-black",
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
        id: "terminal-light",
        name: "Terminal Light",
        description: "Retro terminal, green-on-light",
        dark: false,
        vars: {
            "--lx-bg": "#eef0ee",
            "--lx-text": "#1a3a1a",
            "--lx-text-muted": "#2d6b2d",
            "--lx-accent": "#1a6b1a",
            "--lx-divider": "#b4c4b4",
            "--lx-font-body": "\"IBM Plex Mono\", \"Courier New\", monospace",
        },
    },
    {
        id: "newspaper",
        name: "Newspaper",
        description: "NYT/journalism style",
        dark: false,
        vars: {
            "--lx-bg": "#ffffff",
            "--lx-text": "#1a1a1a",
            "--lx-text-muted": "#555555",
            "--lx-accent": "#1a1a1a",
            "--lx-divider": "#c4c4c4",
            "--lx-font-body": "\"Georgia\", \"Times New Roman\", \"Noto Serif\", serif",
        },
    },
    {
        id: "newspaper-dark",
        name: "Newspaper Dark",
        description: "NYT/journalism style, dark background",
        dark: true,
        vars: {
            "--lx-bg": "#1a1a1a",
            "--lx-text": "#e0e0e0",
            "--lx-text-muted": "#999999",
            "--lx-accent": "#d4d4d4",
            "--lx-divider": "#333333",
            "--lx-font-body": "\"Georgia\", \"Times New Roman\", \"Noto Serif\", serif",
        },
    },
    {
        id: "elegant",
        name: "Elegant",
        description: "High-contrast, refined",
        dark: false,
        vars: {
            "--lx-bg": "#fafaf9",
            "--lx-text": "#1c1917",
            "--lx-text-muted": "#78716c",
            "--lx-accent": "#b45309",
            "--lx-divider": "#d4d0cb",
            "--lx-font-body": "\"Garamond\", \"Georgia\", \"Times New Roman\", serif",
        },
    },
    {
        id: "elegant-dark",
        name: "Elegant Dark",
        description: "High-contrast, refined, dark background",
        dark: true,
        vars: {
            "--lx-bg": "#1c1917",
            "--lx-text": "#e7e5e4",
            "--lx-text-muted": "#a8a29e",
            "--lx-accent": "#f59e0b",
            "--lx-divider": "#44403c",
            "--lx-font-body": "\"Garamond\", \"Georgia\", \"Times New Roman\", serif",
        },
    },
    {
        id: "mono",
        name: "Mono",
        description: "Pure monospace, no decoration",
        dark: false,
        vars: {
            "--lx-bg": "#ffffff",
            "--lx-text": "#171717",
            "--lx-text-muted": "#525252",
            "--lx-accent": "#171717",
            "--lx-divider": "#d4d4d4",
            "--lx-font-body": "\"JetBrains Mono\", \"Fira Code\", \"Consolas\", monospace",
        },
    },
    {
        id: "mono-dark",
        name: "Mono Dark",
        description: "Pure monospace, dark background",
        dark: true,
        vars: {
            "--lx-bg": "#171717",
            "--lx-text": "#e5e5e5",
            "--lx-text-muted": "#a3a3a3",
            "--lx-accent": "#e5e5e5",
            "--lx-divider": "#404040",
            "--lx-font-body": "\"JetBrains Mono\", \"Fira Code\", \"Consolas\", monospace",
        },
    },
    {
        id: "serif",
        name: "Serif",
        description: "Traditional book-like",
        dark: false,
        vars: {
            "--lx-bg": "#fffbf5",
            "--lx-text": "#292524",
            "--lx-text-muted": "#78716c",
            "--lx-accent": "#92400e",
            "--lx-divider": "#c8c3bb",
            "--lx-font-body": "\"Playfair Display\", \"Georgia\", \"Times New Roman\", serif",
        },
    },
    {
        id: "serif-dark",
        name: "Serif Dark",
        description: "Traditional book-like, dark background",
        dark: true,
        vars: {
            "--lx-bg": "#1c1612",
            "--lx-text": "#e7e0d8",
            "--lx-text-muted": "#a89a8c",
            "--lx-accent": "#d97706",
            "--lx-divider": "#3d342c",
            "--lx-font-body": "\"Playfair Display\", \"Georgia\", \"Times New Roman\", serif",
        },
    },
    {
        id: "sans",
        name: "Sans",
        description: "Modern sans-serif",
        dark: false,
        vars: {
            "--lx-bg": "#ffffff",
            "--lx-text": "#18181b",
            "--lx-text-muted": "#71717a",
            "--lx-accent": "#2563eb",
            "--lx-divider": "#d4d4d8",
            "--lx-font-body": "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
        },
    },
    {
        id: "sans-dark",
        name: "Sans Dark",
        description: "Modern sans-serif, dark background",
        dark: true,
        vars: {
            "--lx-bg": "#18181b",
            "--lx-text": "#e4e4e7",
            "--lx-text-muted": "#a1a1aa",
            "--lx-accent": "#60a5fa",
            "--lx-divider": "#3f3f46",
            "--lx-font-body": "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
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

