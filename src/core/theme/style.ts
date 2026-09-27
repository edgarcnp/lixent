/**
 * Theme style resolution.
 *
 * Turns the `theme` section of the config into CSS custom property
 * declarations for the page's `<html>` style attribute, plus the optional
 * font and external stylesheet URLs. Values are sanitized again here as a
 * render-time safety net.
 *
 * @module
 */

import { stripCssUrl } from "../sanitize.ts"
import type { LixentConfig } from "../config/types.ts"
import {
    getTheme,
    isBuiltInTheme,
    THEME_COLOR_KEYS,
    THEME_COLOR_VARIABLES,
    THEME_VARIABLES,
    type ThemeVariable,
} from "./catalog.ts"
import { cssWeightToVariants, getGoogleFontsUrl } from "./font.ts"

/** CSS `font-family` fallback appended after a configured Google Font. */
const FALLBACK_FONT_STACK = "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif"

/** Typography variables that are not part of the theme palette. */
type TypographyVariable
    = | "--lx-font-size"
    | "--lx-font-weight"
    | "--lx-line-height"
    | "--lx-letter-spacing"

type StyleVariable = ThemeVariable | TypographyVariable

export interface ResolvedStyle {
    /** Custom property declarations for the `<html>` style attribute. Empty when there is nothing to override. */
    style: string
    /** Google Fonts stylesheet URL, when a font is configured. */
    fontHref: string | null
    /** External stylesheet path, when `theme.preset` points to one. */
    themeHref: string | null
}

/** Resolves the effective theme: preset variables merged with user overrides. */
export function resolveStyle(config: LixentConfig): ResolvedStyle {
    const { theme } = config
    const declarations = new Map<StyleVariable, string>()

    let themeHref: string | null = null
    if (isBuiltInTheme(theme.preset)) {
        const definition = getTheme(theme.preset)
        if (definition !== undefined) {
            for (const variable of THEME_VARIABLES) {
                declarations.set(variable, definition.vars[variable])
            }
        }
    } else if (theme.preset.startsWith("/")) {
        themeHref = theme.preset
    }

    if (theme.colors !== undefined) {
        for (const key of THEME_COLOR_KEYS) {
            const value = theme.colors[key]
            if (value !== undefined) {
                declarations.set(THEME_COLOR_VARIABLES[key], value)
            }
        }
    }

    if (theme.font !== undefined) {
        declarations.set("--lx-font-body", `"${theme.font}", ${FALLBACK_FONT_STACK}`)
    }
    if (theme.fontSize !== undefined) {
        declarations.set("--lx-font-size", theme.fontSize)
    }
    if (theme.fontWeight !== undefined) {
        declarations.set("--lx-font-weight", theme.fontWeight)
    }
    if (theme.lineHeight !== undefined) {
        declarations.set("--lx-line-height", theme.lineHeight)
    }
    if (theme.letterSpacing !== undefined) {
        declarations.set("--lx-letter-spacing", theme.letterSpacing)
    }

    const style = [...declarations]
        .map(([name, value]) => `${name}: ${stripCssUrl(value)}`)
        .join("; ")
    const fontHref = theme.font !== undefined ? getGoogleFontsUrl(theme.font, cssWeightToVariants(theme.fontWeight)) : null

    return { style, fontHref, themeHref }
}
