import { getGravatarUrl } from "../../core/gravatar.ts"
import { renderLicenseText } from "../../core/license/render.ts"
import { stripDuplicateTitle, toParagraphs } from "../../core/paragraphs.ts"
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
    previewEyebrow: HTMLElement
    previewTitle: HTMLElement
    previewIdentity: HTMLElement
    previewLicenseText: HTMLElement
    previewUrl: HTMLElement
    fontPreview: HTMLElement
    summaryTheme: HTMLElement
    summaryFontStyling: HTMLElement
    summaryLicense: HTMLElement
    summaryIdentity: HTMLElement
    deprecatedWarning: HTMLElement
} | null = null

export function initPreviewElements(): void {
    el = {
        previewContent: $("preview-content"),
        previewEyebrow: $("preview-eyebrow"),
        previewTitle: $("preview-title"),
        previewIdentity: $("preview-identity"),
        previewLicenseText: $("preview-license-text"),
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

function updateEyebrow(licenseId: string): void {
    const view = el
    if (view === null) return
    if (licenseId === "custom") {
        view.previewEyebrow.textContent = "Software License"
        return
    }
    const href = `https://spdx.org/licenses/${encodeURIComponent(licenseId)}.html`
    view.previewEyebrow.innerHTML = `<a href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(`SPDX-License-Identifier: ${licenseId}`)}</a>`
}

function identityHtml(copyright: string, email: string, url: string, yearStart: number, yearEnd: number): string {
    const hasUrl = url.length > 0 && isValidUrl(url)
    const hasEmail = email.length > 0 && isValidEmail(email)
    const safeName = escapeHtml(copyright)
    const nameHtml = hasUrl
        ? `<a class="identity-name" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${safeName}</a>`
        : `<span class="identity-name">${safeName}</span>`
    const emailHtml = hasEmail
        ? `<span class="identity-sep" aria-hidden="true"> · </span><a class="identity-email" href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`
        : ""
    const yearDisplay = yearStart !== yearEnd ? `${yearStart}\u2013${yearEnd}` : String(yearStart)
    return `<span class="identity-avatar" id="preview-avatar"></span>${nameHtml}${emailHtml}<span class="identity-sep" aria-hidden="true"> · </span><span class="identity-year">&copy; ${yearDisplay}</span>`
}

function initialsOf(name: string): string {
    return name
        .split(" ")
        .filter((word) => word.length > 0)
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
}

async function updateAvatar(email: string, copyright: string, showGravatar: boolean): Promise<void> {
    const view = el
    if (view === null) return
    const avatar = view.previewIdentity.querySelector<HTMLElement>("#preview-avatar")
    if (avatar === null) return
    avatar.replaceChildren()
    const hasEmail = email.length > 0 && isValidEmail(email)
    if (!showGravatar || !hasEmail) return

    const img = document.createElement("img")
    img.alt = copyright
    img.width = 32
    img.height = 32
    img.onerror = () => {
        const fallback = document.createElement("span")
        fallback.className = "identity-initials"
        fallback.textContent = initialsOf(copyright)
        avatar.replaceChildren(fallback)
    }
    try {
        img.src = await getGravatarUrl(email, 64)
        avatar.replaceChildren(img)
    } catch {
        // Hashing failed; leave the avatar empty.
    }
}

function updateHeader(settings: DemoSettings, copyright: string, yearStart: number, yearEnd: number): void {
    const view = el
    if (view === null) return
    updateEyebrow(settings.license)
    view.previewTitle.textContent = settings.license === "custom"
        ? settings.customLicenseName || "Custom License"
        : getLicenseName(settings.license)
    view.previewIdentity.innerHTML = identityHtml(copyright, settings.email, settings.url, yearStart, yearEnd)
    void updateAvatar(settings.email, copyright, settings.gravatar)
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
    view.summaryLicense.textContent = settings.license === "custom"
        ? settings.customLicenseName || "Custom License"
        : getLicenseName(settings.license)
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
        const rawText = settings.license === "custom"
            ? settings.customLicenseText
            : await loadLicenseText(settings.license, controller.signal)
        const yearStr = yearStart !== yearEnd ? `${yearStart}\u2013${yearEnd}` : String(yearStart)
        const rendered = renderLicenseText(rawText, {
            year: yearStr,
            name: copyright,
            url: settings.url,
            email: settings.email,
        })
        const title = settings.license === "custom"
            ? settings.customLicenseName || "Custom License"
            : getLicenseName(settings.license)
        view.previewLicenseText.innerHTML = stripDuplicateTitle(toParagraphs(rendered), title)
            .map((paragraph) => paragraph.kind === "heading"
                ? `<p class="section-heading">${escapeHtml(paragraph.text)}</p>`
                : `<p>${escapeHtml(paragraph.text)}</p>`)
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

    updateHeader(settings, copyright, yearStart, yearEnd)
    void fetchAndRender(settings, copyright, yearStart, yearEnd)
    view.previewUrl.textContent = `${settings.theme} / ${settings.license}`
    updateSummary(settings)
}
