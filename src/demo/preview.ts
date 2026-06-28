import { getGravatarUrl } from "./gravatar.ts"
import { loadLicenseText, renderLicenseText } from "./licenses.ts"
import { getGoogleFontsUrl, getFontFamily } from "../lib/font.ts"
import type { SpdxLicense } from "../lib/license.ts"
import type { GoogleFont } from "../lib/font.ts"
import type { DropdownOption } from "./dropdown.ts"
import { $, escapeHtml, formatParagraphs, isValidEmail, isValidUrl, BASE_URL } from "./helpers.ts"
import { DEFAULTS } from "./settings.ts"

let allLicenses: SpdxLicense[] = []
let allFonts: GoogleFont[] = []
let activeGoogleFontLink: HTMLLinkElement | null = null
const preloadedFamilies = new Set<string>()
const fullyLoadedFamilies = new Set<string>()
const themeCache = new Map<string, string>()
let previewThemeStyle: HTMLStyleElement | null = null
let themeAbort: AbortController | null = null

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
    const match = allLicenses.find((l) => l.licenseId === id)
    return match != null ? match.name : id
}

function isDeprecated(id: string): boolean {
    const match = allLicenses.find((l) => l.licenseId === id)
    return match?.isDeprecatedLicenseId === true
}

export function licenseToOption(lic: SpdxLicense): DropdownOption {
    return {
        value: lic.licenseId,
        label: lic.isDeprecatedLicenseId ? `${lic.name} (deprecated)` : lic.name,
    }
}

export function fontToOption(font: GoogleFont): DropdownOption {
    const fontCss = getFontFamily(font.family)
    return {
        value: font.family,
        label: font.family,
        meta: font.category,
        fontPreview: fontCss,
    }
}

function loadGoogleFont(family: string): void {
    if (family.length === 0) {
        activeGoogleFontLink?.remove()
        activeGoogleFontLink = null
        return
    }
    if (fullyLoadedFamilies.has(family)) return
    const font = allFonts.find((f) => f.family === family)
    if (font == null) return
    const url = getGoogleFontsUrl(font.family, font.variants)
    if (url == null) return
    preloadedFamilies.delete(family)
    fullyLoadedFamilies.add(family)
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = url
    link.addEventListener("load", () => {
        activeGoogleFontLink?.remove()
        activeGoogleFontLink = link
    }, { once: true })
    document.head.appendChild(link)
}

export function preloadGoogleFont(family: string): void {
    if (preloadedFamilies.has(family) || fullyLoadedFamilies.has(family)) return
    const font = allFonts.find((f) => f.family === family)
    if (font == null) return
    const url = getGoogleFontsUrl(font.family, ["regular"])
    if (url == null) return
    preloadedFamilies.add(family)
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = url
    document.head.appendChild(link)
}

export function setAllLicenses(licenses: SpdxLicense[]): void {
    allLicenses = licenses
}

export function setAllFonts(fonts: GoogleFont[]): void {
    allFonts = fonts
}

let licenseAbort: AbortController | null = null

function applyThemeStyle(css: string): void {
    if (!previewThemeStyle) {
        previewThemeStyle = document.createElement("style")
        previewThemeStyle.id = "preview-theme"
        const old = $("preview-theme") as HTMLLinkElement
        old.replaceWith(previewThemeStyle)
    }
    previewThemeStyle.textContent = css
}

function updateTheme(theme: string): void {
    if (!el) return
    const newHref = `${BASE_URL}themes/${theme}.css`
    const cached = themeCache.get(newHref)
    if (cached != null) {
        applyThemeStyle(cached)
    } else {
        themeAbort?.abort()
        themeAbort = new AbortController()
        void fetch(newHref, { signal: themeAbort.signal })
            .then((r) => r.text())
            .then((css) => {
                themeCache.set(newHref, css)
                applyThemeStyle(css)
            })
            .catch((e: unknown) => { if (e instanceof Error && e.name !== "AbortError") console.warn(e) })
    }
}

function updateFont(family: string): void {
    if (!el) return
    if (family.length > 0) {
        loadGoogleFont(family)
        el.previewContent.style.setProperty("--lx-font-body", getFontFamily(family))
    } else {
        loadGoogleFont("")
        el.previewContent.style.setProperty("--lx-font-body", DEFAULTS.fontFallback)
    }

    const pangram = el.fontPreview.querySelector<HTMLElement>(".font-preview-pangram")
    const specimen = el.fontPreview.querySelector<HTMLElement>(".font-preview-specimen")
    if (pangram && specimen) {
        const fontCss = family.length > 0 ? getFontFamily(family) : DEFAULTS.fontFallback
        pangram.style.fontFamily = fontCss
        specimen.style.fontFamily = fontCss
        pangram.style.opacity = "1"
        specimen.style.opacity = "1"
    }
}

function updateTypography(state: {
    fontSizeInput: HTMLInputElement
    fontWeightInput: HTMLInputElement
    lineHeightInput: HTMLInputElement
    letterSpacingInput: HTMLInputElement
}): void {
    if (!el) return
    const { fontSizeInput, fontWeightInput, lineHeightInput, letterSpacingInput } = state
    const fontSize = fontSizeInput.value.trim()
    const fontWeight = fontWeightInput.value.trim()
    const lineHeight = lineHeightInput.value.trim()
    const letterSpacing = letterSpacingInput.value.trim()

    if (fontSize.length > 0) {
        el.previewContent.style.setProperty("--lx-font-size", fontSize)
    } else {
        el.previewContent.style.setProperty("--lx-font-size", DEFAULTS.fontSize)
    }
    if (fontWeight.length > 0) {
        el.previewContent.style.setProperty("font-weight", fontWeight)
    } else {
        el.previewContent.style.removeProperty("font-weight")
    }
    if (lineHeight.length > 0) {
        el.previewContent.style.setProperty("--lx-line-height", lineHeight)
    } else {
        el.previewContent.style.setProperty("--lx-line-height", DEFAULTS.lineHeight)
    }
    if (letterSpacing.length > 0) {
        el.previewContent.style.setProperty("letter-spacing", letterSpacing)
    } else {
        el.previewContent.style.removeProperty("letter-spacing")
    }
}

function updateCopyrightLine(
    copyright: string,
    email: string,
    url: string,
    yearStart: number,
    yearEnd: number,
): void {
    if (!el) return
    const hasUrl = url.length > 0 && isValidUrl(url)
    const hasEmail = email.length > 0 && isValidEmail(email)
    const safeCopyright = escapeHtml(copyright)
    const safeEmail = escapeHtml(email)
    const nameHtml = hasUrl
        ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${safeCopyright}</a>`
        : safeCopyright
    const emailHtml = hasEmail
        ? ` &lt;<a href="mailto:${safeEmail}">${safeEmail}</a>&gt;`
        : ""
    const yearDisplay = yearStart !== yearEnd
        ? `${yearStart}\u2013${yearEnd}`
        : String(yearStart)
    el.previewCopyright.innerHTML = `Copyright &copy; ${yearDisplay} ${nameHtml}${emailHtml}`
}

async function updateGravatar(email: string, copyright: string, showGravatar: boolean): Promise<void> {
    if (!el) return
    const hasEmail = email.length > 0 && isValidEmail(email)

    if (showGravatar && hasEmail) {
        if (!gravatarInline) {
            gravatarInline = document.createElement("img")
            gravatarInline.className = "gravatar-inline"
            gravatarInline.width = 24
            gravatarInline.height = 24
            gravatarInline.onerror = () => {
                if (!gravatarInline || !el) return
                gravatarInline.style.display = "none"
                if (!gravatarFallback) {
                    gravatarFallback = document.createElement("span")
                    gravatarFallback.className = "gravatar-inline gravatar-fallback"
                    gravatarFallback.textContent = copyright.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                    gravatarInline.parentNode?.insertBefore(gravatarFallback, gravatarInline.nextSibling)
                }
            }
            el.previewCopyright.prepend(gravatarInline)
        }
        const newSrc = await getGravatarUrl(email, 24)
        if (gravatarInline.src !== newSrc) {
            gravatarInline.src = newSrc
            gravatarInline.alt = copyright
            if (gravatarFallback) {
                gravatarFallback.remove()
                gravatarFallback = null
            }
            gravatarInline.style.display = ""
        }
    } else if (gravatarInline) {
        gravatarInline.remove()
        gravatarInline = null
        gravatarFallback?.remove()
        gravatarFallback = null
    }
}

function updateSummary(
    theme: string,
    fontLabel: string,
    fontSize: string,
    licenseId: string,
    copyright: string,
    email: string,
): void {
    if (!el) return
    const hasEmail = email.length > 0 && isValidEmail(email)
    el.summaryTheme.textContent = theme
        .replace(/-(?:dark|light)$/, "")
        .replace(/^\w/, (c) => c.toUpperCase())
        + (theme.endsWith("-light") ? " Light" : " Dark")
    const parts: string[] = []
    if (fontLabel !== DEFAULTS.font) parts.push(fontLabel)
    if (fontSize.length > 0) parts.push(fontSize)
    el.summaryFontStyling.textContent = parts.length > 0 ? parts.join(" · ") : DEFAULTS.font
    el.summaryLicense.textContent = getLicenseName(licenseId)
    el.summaryIdentity.textContent = (copyright || "John Doe") + (hasEmail ? ` · ${email.split("@")[1]}` : "")
}

export function updatePreview(state: {
    getSelectedTheme: () => string
    fontDropdown: { getValue: () => string }
    fontSizeInput: HTMLInputElement
    fontWeightInput: HTMLInputElement
    lineHeightInput: HTMLInputElement
    letterSpacingInput: HTMLInputElement
    licenseDropdown: { getValue: () => string }
    copyrightInput: HTMLInputElement
    emailInput: HTMLInputElement
    urlInput: HTMLInputElement
    yearInput: HTMLInputElement
    yearStartInput: HTMLInputElement
    yearEndInput: HTMLInputElement
    yearMode: "single" | "range"
    gravatarToggle: HTMLInputElement
    currentYear: number
    customLicenseName?: string
    customLicenseText?: string
}): void {
    const {
        getSelectedTheme, fontDropdown, fontSizeInput, fontWeightInput,
        lineHeightInput, letterSpacingInput, licenseDropdown, copyrightInput,
        emailInput, urlInput, yearInput, yearStartInput, yearEndInput, yearMode, gravatarToggle, currentYear,
        customLicenseName, customLicenseText,
    } = state

    const theme = getSelectedTheme()
    const fontFamily = fontDropdown.getValue()
    const fontSize = fontSizeInput.value.trim()
    const licenseId = licenseDropdown.getValue()
    const copyright = copyrightInput.value || "John Doe"
    const email = emailInput.value.trim()
    const url = urlInput.value.trim()
    const yearStart = yearMode === "single"
        ? (yearInput.value.length > 0 ? parseInt(yearInput.value) : currentYear)
        : (yearStartInput.value.length > 0 ? parseInt(yearStartInput.value) : currentYear)
    const yearEnd = yearMode === "single"
        ? yearStart
        : (yearEndInput.value.length > 0 ? parseInt(yearEndInput.value) : currentYear)
    if (!el) return

    updateTheme(theme)
    updateFont(fontFamily)
    updateTypography({ fontSizeInput, fontWeightInput, lineHeightInput, letterSpacingInput })

    const show = isDeprecated(licenseId)
    el.deprecatedWarning.style.display = show ? "inline-flex" : "none"

    void fetchAndRender(licenseId, copyright, yearStart, yearEnd, el.previewLicenseText, el.previewTitle, customLicenseName, customLicenseText)

    updateCopyrightLine(copyright, email, url, yearStart, yearEnd)
    void updateGravatar(email, copyright, gravatarToggle.checked)
    el.previewUrl.textContent = `${theme} / ${licenseId}`
    updateSummary(theme, fontDropdown.getValue() || DEFAULTS.font, fontSize, licenseId, copyright, email)
}

export async function fetchAndRender(
    licenseId: string,
    copyright: string,
    yearStart: number,
    yearEnd: number,
    previewLicenseText: HTMLElement,
    previewTitle: HTMLElement,
    customLicenseName?: string,
    customLicenseText?: string,
): Promise<void> {
    licenseAbort?.abort()
    const controller = new AbortController()
    licenseAbort = controller
    try {
        let rawText: string
        let title: string
        if (licenseId === "custom") {
            rawText = customLicenseText ?? ""
            title = customLicenseName || "Custom License"
        } else {
            rawText = await loadLicenseText(licenseId, controller.signal)
            title = getLicenseName(licenseId)
        }
        const yearStr = yearStart !== yearEnd
            ? `${yearStart}\u2013${yearEnd}`
            : String(yearStart)
        const rendered = renderLicenseText(rawText, { year: yearStr, name: copyright })
        previewTitle.textContent = title
        previewLicenseText.innerHTML = formatParagraphs(escapeHtml(rendered))
    } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        previewLicenseText.innerHTML = "<p>Failed to load license text.</p>"
    }
}
