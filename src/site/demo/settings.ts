/**
 * Demo settings and config serialization.
 *
 * `buildPreviewConfig()` produces the config used to resolve preview styles;
 * `buildConfigJson()` produces the minimal `lixent.config.json` shown by the
 * copy and download buttons. Both are pure and unit-tested.
 *
 * @module
 */

import type { LixentConfig, ThemeConfig } from "../../core/config/types.ts"
import { isValidUrl } from "./validation.ts"

export const DEFAULTS = {
    theme: "minimal-dark",
    font: "Inter",
    license: "MIT",
} as const

/** Preset the custom theme card builds on. */
export const CUSTOM_THEME_PRESET = "minimal-dark"

export const CUSTOM_THEME_DEFAULTS = {
    bg: "#1a1a1a",
    text: "#e5e5e5",
    textMuted: "#a3a3a3",
    accent: "#60a5fa",
    border: "#404040",
} as const

export interface DemoSettings {
    theme: string
    font: string
    fontSize: string
    fontWeight: string
    lineHeight: string
    letterSpacing: string
    license: string
    copyright: string
    email: string
    url: string
    yearInput: string
    yearStart: string
    yearEnd: string
    yearMode: "single" | "range"
    gravatar: boolean
    customLicenseName: string
    customLicenseText: string
    customThemeBg: string
    customThemeText: string
    customThemeTextMuted: string
    customThemeAccent: string
    customThemeBorder: string
}

function buildTheme(settings: DemoSettings): ThemeConfig {
    const theme: ThemeConfig = {
        preset: settings.theme === "custom" ? CUSTOM_THEME_PRESET : settings.theme,
    }
    if (settings.theme === "custom") {
        theme.colors = {
            bg: settings.customThemeBg || CUSTOM_THEME_DEFAULTS.bg,
            text: settings.customThemeText || CUSTOM_THEME_DEFAULTS.text,
            textMuted: settings.customThemeTextMuted || CUSTOM_THEME_DEFAULTS.textMuted,
            accent: settings.customThemeAccent || CUSTOM_THEME_DEFAULTS.accent,
            border: settings.customThemeBorder || CUSTOM_THEME_DEFAULTS.border,
        }
    }
    if (settings.font.length > 0) theme.font = settings.font
    if (settings.fontSize.length > 0) theme.fontSize = settings.fontSize
    if (settings.fontWeight.length > 0) theme.fontWeight = settings.fontWeight
    if (settings.lineHeight.length > 0) theme.lineHeight = settings.lineHeight
    if (settings.letterSpacing.length > 0) theme.letterSpacing = settings.letterSpacing
    return theme
}

/** Full config used to resolve preview styles (never serialized to disk). */
export function buildPreviewConfig(settings: DemoSettings): LixentConfig {
    return {
        copyright: settings.copyright || "John Doe",
        license: settings.license,
        gravatar: false,
        theme: buildTheme(settings),
    }
}

/** Minimal `lixent.config.json` for the copy and download buttons. */
export function buildConfigJson(settings: DemoSettings): Record<string, unknown> {
    const config: Record<string, unknown> = {}

    if (settings.copyright.length > 0) config.copyright = settings.copyright
    if (settings.url.length > 0 && isValidUrl(settings.url)) config.url = settings.url
    if (settings.email.length > 0) config.email = settings.email
    if (settings.gravatar) config.gravatar = true

    if (settings.license === "custom") {
        config.license = "custom"
        if (settings.customLicenseName.length > 0 || settings.customLicenseText.length > 0) {
            config.customLicense = {
                name: settings.customLicenseName || "Custom License",
                text: settings.customLicenseText,
            }
        }
    } else {
        config.license = settings.license
    }

    const theme = buildTheme(settings)
    const output: Record<string, unknown> = { preset: theme.preset }
    if (theme.colors !== undefined) output.colors = theme.colors
    if (theme.font !== undefined && settings.font !== DEFAULTS.font) output.font = theme.font
    if (theme.fontSize !== undefined) output.fontSize = theme.fontSize
    if (theme.fontWeight !== undefined) output.fontWeight = theme.fontWeight
    if (theme.lineHeight !== undefined) output.lineHeight = theme.lineHeight
    if (theme.letterSpacing !== undefined) output.letterSpacing = theme.letterSpacing
    config.theme = output

    if (settings.yearMode === "single") {
        const year = parseInt(settings.yearInput, 10)
        if (!isNaN(year) && year !== new Date().getFullYear()) config.year = year
    } else {
        const start = parseInt(settings.yearStart, 10)
        const end = parseInt(settings.yearEnd, 10)
        if (!isNaN(start) && !isNaN(end)) {
            if (start !== end) {
                config.yearRange = { start, end }
            } else if (start !== new Date().getFullYear()) {
                config.year = start
            }
        }
    }

    return config
}
