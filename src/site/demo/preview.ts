import { getGravatarUrl } from "../../core/gravatar.ts"
import { renderLicenseText } from "../../core/license/render.ts"
import { toParagraphs } from "../../core/paragraphs.ts"
import { getTheme } from "../../core/theme/catalog.ts"
import { getFontFamily, getGoogleFontsUrl, type GoogleFont } from "../../core/theme/font.ts"
import { resolveStyle, STYLE_VARIABLES } from "../../core/theme/style.ts"
import type { DropdownOption } from "./dropdown.ts"
import { $, escapeHtml } from "./helpers.ts"
import { loadLicenseText, type SpdxLicense } from "./licenses.ts"
import { buildPreviewConfig, DEFAULTS, type DemoSettings } from "./settings.ts"
import { isValidEmail, isValidUrl } from "./validation.ts"

let allLicenses: SpdxLicense[] = []
let allFonts: GoogleFont[] = []
let activeFontLink: HTMLLinkElement | null = null
const preloadedFamilies = new Set<string>()
let licenseAbort: AbortController | null = null

let el: {
    previewContent: HTMLElement
    previewCopyright: HTMLElement
    previewLicenseText: HTMLElement
    previewTitle: HTMLElement
    previewUrl: HTMLElement
    fontPreview: HTMLElement
    summaryTheme: HTMLElement
    summaryFontStyling: HTMLElement
    summaryLicense: HTMLElement
    summaryIdentity: HTMLElement
    deprecatedWarning: HTMLElement
} | null = null

let gravatarInline: HTMLImageElement | null = null
let gravatarFallback: HTMLElement | null = null

export function initPreviewElements(): void {
    el = {
        previewContent: $("preview-content"),
        previewCopyright: $("preview-copyright"),
        previewLicenseText: $("preview-license-text"),
        previewTitle: $("preview-title"),
        previewUrl: $("preview-url"),
        fontPreview: $("font-preview"),
        summaryTheme: $("summary-theme"),
        summaryFontStyling: $("summary-font-styling"),
        summaryLicense: $("summary-license"),
        summaryIdentity: $("summary-identity"),
        deprecatedWarning: $("deprecated-warning"),
    }
}

function getLicenseName(id: string): string {
    const match = allLicenses.find((license) => license.licenseId === id)
    return match?.name ?? id
}

function isDeprecated(id: string): boolean {
    return allLicenses.find((license) => license.licenseId === id)?.isDeprecatedLicenseId === true
}

export function licenseToOption(license: SpdxLicense): DropdownOption {
    return {
        value: license.licenseId,
        label: license.isDeprecatedLicenseId ? `${license.name} (deprecated)` : license.name,
    }
}

export function fontToOption(font: GoogleFont): DropdownOption {
    return {
        value: font.family,
        label: font.family,
        meta: font.category,
        fontPreview: getFontFamily(font.family),
    }
}

export function setAllLicenses(licenses: SpdxLicense[]): void {
    allLicenses = licenses
}

export function setAllFonts(fonts: GoogleFont[]): void {
    allFonts = fonts
}

/** Preloads the regular weight so the dropdown can preview a family. */
export function preloadGoogleFont(family: string): void {
    if (preloadedFamilies.has(family)) return
    preloadedFamilies.add(family)
    const font = allFonts.find((entry) => entry.family === family)
    if (font === undefined) return
    const url = getGoogleFontsUrl(font.family, ["regular"])
    if (url === null) return
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = url
    document.head.appendChild(link)
}

function applyFontLink(url: string | null): void {
    if (url === null) {
        activeFontLink?.remove()
        activeFontLink = null
        return
    }
    if (activeFontLink === null) {
        activeFontLink = document.createElement("link")
        activeFontLink.rel = "stylesheet"
        document.head.appendChild(activeFontLink)
    }
    if (activeFontLink.href !== url) {
        activeFontLink.href = url
    }
}

function updateFontPreview(family: string): void {
    const view = el
    if (view === null) return
    const fontCss = getFontFamily(family)
    const pangram = view.fontPreview.querySelector<HTMLElement>(".font-preview-pangram")
    const specimen = view.fontPreview.querySelector<HTMLElement>(".font-preview-specimen")
    if (pangram !== null) {
        pangram.style.fontFamily = fontCss
        pangram.style.opacity = "1"
    }
    if (specimen !== null) {
        specimen.style.fontFamily = fontCss
        specimen.style.opacity = "1"
    }
}

function applyPreviewStyle(settings: DemoSettings): void {
    const view = el
    if (view === null) return
    for (const variable of STYLE_VARIABLES) {
        view.previewContent.style.removeProperty(variable)
    }
    const resolved = resolveStyle(buildPreviewConfig(settings))
    for (const [variable, value] of resolved.declarations) {
        view.previewContent.style.setProperty(variable, value)
    }
    applyFontLink(resolved.fontHref)
    updateFontPreview(settings.font)
}

function updateCopyrightLine(copyright: string, email: string, url: string, yearStart: number, yearEnd: number): void {
    const view = el
    if (view === null) return
    const hasUrl = url.length > 0 && isValidUrl(url)
    const hasEmail = email.length > 0 && isValidEmail(email)
    const safeCopyright = escapeHtml(copyright)
    const safeEmail = escapeHtml(email)
    const nameHtml = hasUrl
        ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${safeCopyright}</a>`
        : safeCopyright
    const emailHtml = hasEmail ? ` &lt;<a href="mailto:${safeEmail}">${safeEmail}</a>&gt;` : ""
    const yearDisplay = yearStart !== yearEnd ? `${yearStart}\u2013${yearEnd}` : String(yearStart)
    view.previewCopyright.innerHTML = `Copyright &copy; ${yearDisplay} ${nameHtml}${emailHtml}`
}

async function updateGravatar(email: string, copyright: string, showGravatar: boolean): Promise<void> {
    const view = el
    if (view === null) return
    const hasEmail = email.length > 0 && isValidEmail(email)
    if (showGravatar && hasEmail) {
        if (gravatarInline === null) {
            const img = document.createElement("img")
            img.className = "gravatar-inline"
            img.width = 24
            img.height = 24
            img.onerror = () => {
                img.style.display = "none"
                if (gravatarFallback === null) {
                    gravatarFallback = document.createElement("span")
                    gravatarFallback.className = "gravatar-inline gravatar-fallback"
                    gravatarFallback.textContent = copyright
                        .split(" ")
                        .filter((word) => word.length > 0)
                        .map((word) => word[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    img.parentNode?.insertBefore(gravatarFallback, img.nextSibling)
                }
            }
            view.previewCopyright.prepend(img)
            gravatarInline = img
        }
        const newSrc = await getGravatarUrl(email, 24)
        if (gravatarInline.src !== newSrc) {
            gravatarInline.src = newSrc
            gravatarInline.alt = copyright
            gravatarFallback?.remove()
            gravatarFallback = null
            gravatarInline.style.display = ""
        }
    } else if (gravatarInline !== null) {
        gravatarInline.remove()
        gravatarInline = null
        gravatarFallback?.remove()
        gravatarFallback = null
    }
}

function updateSummary(settings: DemoSettings): void {
    const view = el
    if (view === null) return
    view.summaryTheme.textContent = settings.theme === "custom"
        ? "Custom"
        : getTheme(settings.theme)?.name ?? settings.theme
    const parts: string[] = []
    if (settings.font.length > 0 && settings.font !== DEFAULTS.font) parts.push(settings.font)
    if (settings.fontSize.length > 0) parts.push(settings.fontSize)
    view.summaryFontStyling.textContent = parts.length > 0 ? parts.join(" · ") : "Default"
    view.summaryLicense.textContent = getLicenseName(settings.license)
    const hasEmail = isValidEmail(settings.email)
    view.summaryIdentity.textContent = (settings.copyright || "John Doe")
        + (hasEmail ? ` · ${settings.email.split("@")[1]}` : "")
}

async function fetchAndRender(
    settings: DemoSettings,
    copyright: string,
    yearStart: number,
    yearEnd: number,
): Promise<void> {
    const view = el
    if (view === null) return
    licenseAbort?.abort()
    const controller = new AbortController()
    licenseAbort = controller
    try {
        let rawText: string
        let title: string
        if (settings.license === "custom") {
            rawText = settings.customLicenseText
            title = settings.customLicenseName || "Custom License"
        } else {
            rawText = await loadLicenseText(settings.license, controller.signal)
            title = getLicenseName(settings.license)
        }
        const yearStr = yearStart !== yearEnd ? `${yearStart}\u2013${yearEnd}` : String(yearStart)
        const rendered = renderLicenseText(rawText, {
            year: yearStr,
            name: copyright,
            url: settings.url,
            email: settings.email,
        })
        view.previewTitle.textContent = title
        view.previewLicenseText.innerHTML = toParagraphs(rendered)
            .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
            .join("")
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        view.previewLicenseText.innerHTML = "<p>Failed to load license text.</p>"
    }
}

export function updatePreview(settings: DemoSettings, currentYear: number): void {
    const view = el
    if (view === null) return
    applyPreviewStyle(settings)

    view.deprecatedWarning.style.display = isDeprecated(settings.license) ? "inline-flex" : "none"

    const yearStart = settings.yearMode === "single"
        ? (settings.yearInput.length > 0 ? parseInt(settings.yearInput, 10) : currentYear)
        : (settings.yearStart.length > 0 ? parseInt(settings.yearStart, 10) : currentYear)
    const yearEnd = settings.yearMode === "single"
        ? yearStart
        : (settings.yearEnd.length > 0 ? parseInt(settings.yearEnd, 10) : currentYear)
    const copyright = settings.copyright || "John Doe"

    void fetchAndRender(settings, copyright, yearStart, yearEnd)
    updateCopyrightLine(copyright, settings.email, settings.url, yearStart, yearEnd)
    void updateGravatar(settings.email, copyright, settings.gravatar)
    view.previewUrl.textContent = `${settings.theme} / ${settings.license}`
    updateSummary(settings)
}
