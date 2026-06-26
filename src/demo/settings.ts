import { isValidUrl } from "./helpers.ts"

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
    yearStart: string
    yearEnd: string
    gravatar: boolean
}

export function buildConfigJson(settings: DemoSettings): Record<string, unknown> {
    const config: Record<string, unknown> = {
        license: settings.license,
        theme: settings.theme,
    }
    if (settings.copyright.length > 0) config.copyright = settings.copyright
    if (settings.font.length > 0 && settings.font !== "Inter") config.font = settings.font
    if (settings.fontSize.length > 0) config.fontSize = settings.fontSize
    if (settings.fontWeight.length > 0) config.fontWeight = settings.fontWeight
    if (settings.lineHeight.length > 0) config.lineHeight = settings.lineHeight
    if (settings.letterSpacing.length > 0) config.letterSpacing = settings.letterSpacing
    if (settings.email.length > 0) config.email = settings.email
    if (settings.url.length > 0 && isValidUrl(settings.url)) config.url = settings.url
    if (settings.gravatar) config.gravatar = true
    const start = parseInt(settings.yearStart)
    const end = parseInt(settings.yearEnd)
    if (!isNaN(start) && !isNaN(end)) {
        if (start !== end) {
            config.yearRange = { start, end }
        } else if (start !== new Date().getFullYear()) {
            config.year = start
        }
    }
    return config
}
