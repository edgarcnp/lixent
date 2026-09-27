/**
 * Theme style resolution.
 *
 * Turns the `theme` section of the config into CSS custom property
 * declarations. The real page serializes them into the `<html>` style
 * attribute; the demo applies them to its preview element directly. Values
 * are sanitized again here as a render-time safety net.
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
} from "./catalog.ts"
import { cssWeightToVariants, getFontFamily, getGoogleFontsUrl } from "./font.ts"

/** Every CSS custom property the style resolver can set. */
export const STYLE_VARIABLES = [
    ...THEME_VARIABLES,
    "--lx-font-size",
    "--lx-font-weight",
    "--lx-line-height",
    "--lx-letter-spacing",
] as const

export type StyleVariable = (typeof STYLE_VARIABLES)[number]

export interface ResolvedStyle {
    /** Effective custom properties, in application order. */
    declarations: Map<StyleVariable, string>
    /** Declarations formatted for an HTML `style` attribute. */
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

    function set(variable: StyleVariable, value: string): void {
        declarations.set(variable, stripCssUrl(value))
    }

    let themeHref: string | null = null
    if (isBuiltInTheme(theme.preset)) {
        const definition = getTheme(theme.preset)
        if (definition !== undefined) {
            for (const variable of THEME_VARIABLES) {
                set(variable, definition.vars[variable])
            }
        }
    } else if (theme.preset.startsWith("/")) {
        themeHref = theme.preset
    }

    if (theme.colors !== undefined) {
        for (const key of THEME_COLOR_KEYS) {
            const value = theme.colors[key]
            if (value !== undefined) {
                set(THEME_COLOR_VARIABLES[key], value)
            }
        }
    }

    if (theme.font !== undefined) {
        set("--lx-font-body", getFontFamily(theme.font))
    }
    if (theme.fontSize !== undefined) {
        set("--lx-font-size", theme.fontSize)
    }
    if (theme.fontWeight !== undefined) {
        set("--lx-font-weight", theme.fontWeight)
    }
    if (theme.lineHeight !== undefined) {
        set("--lx-line-height", theme.lineHeight)
    }
    if (theme.letterSpacing !== undefined) {
        set("--lx-letter-spacing", theme.letterSpacing)
    }

    const style = [...declarations]
        .map(([name, value]) => `${name}: ${value}`)
        .join("; ")
    const fontHref = theme.font !== undefined ? getGoogleFontsUrl(theme.font, cssWeightToVariants(theme.fontWeight)) : null

    return { declarations, style, fontHref, themeHref }
}
