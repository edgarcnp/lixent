import { isValidUrl } from "./helpers.ts"
import { FONT_FALLBACK } from "../lib/font.ts"

export const DEFAULTS = {
    theme: "minimal-dark",
    font: "Inter",
    license: "MIT",
    fontSize: "18px",
    lineHeight: "1.7",
    fontFallback: FONT_FALLBACK,
} as const

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

    if (settings.theme === "custom") {
        config.theme = "custom"
        config.customTheme = {
            bg: settings.customThemeBg || CUSTOM_THEME_DEFAULTS.bg,
            text: settings.customThemeText || CUSTOM_THEME_DEFAULTS.text,
            textMuted: settings.customThemeTextMuted || CUSTOM_THEME_DEFAULTS.textMuted,
            accent: settings.customThemeAccent || CUSTOM_THEME_DEFAULTS.accent,
            border: settings.customThemeBorder || CUSTOM_THEME_DEFAULTS.border,
        }
    } else {
        config.theme = settings.theme
    }

    if (settings.font.length > 0 && settings.font !== DEFAULTS.font) config.font = settings.font
    if (settings.fontSize.length > 0) config.fontSize = settings.fontSize
    if (settings.fontWeight.length > 0) config.fontWeight = settings.fontWeight
    if (settings.lineHeight.length > 0) config.lineHeight = settings.lineHeight
    if (settings.letterSpacing.length > 0) config.letterSpacing = settings.letterSpacing

    if (settings.yearMode === "single") {
        const year = parseInt(settings.yearInput)
        if (!isNaN(year) && year !== new Date().getFullYear()) {
            config.year = year
        }
    } else {
        const start = parseInt(settings.yearStart)
        const end = parseInt(settings.yearEnd)
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
