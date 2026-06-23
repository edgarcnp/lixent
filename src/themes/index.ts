export interface ThemeMeta {
  id: string;
  name: string;
  description: string;
  dark: boolean;
  variables: string[];
}

const THEME_VARIABLES = [
  "--lp-bg",
  "--lp-text",
  "--lp-text-muted",
  "--lp-accent",
  "--lp-border",
  "--lp-surface",
  "--lp-font-body",
  "--lp-font-mono",
  "--lp-font-size",
  "--lp-line-height",
  "--lp-max-width",
  "--lp-padding",
  "--lp-border-radius",
];

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
];

export function getTheme(id: string): ThemeMeta | undefined {
  return themes.find((t) => t.id === id);
}

export function isValidTheme(id: string): boolean {
  return themes.some((t) => t.id === id);
}
