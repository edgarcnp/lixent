import { getGravatarUrl } from "./gravatar.ts"
import { loadLicenseText, renderLicenseText } from "./licenses.ts"
import { getGoogleFontsUrl, getFontFamily } from "../lib/font.ts"
import type { SpdxLicense } from "../lib/license.ts"
import type { GoogleFont } from "../lib/font.ts"
import type { DropdownOption } from "./dropdown.ts"
import { $, escapeHtml, formatParagraphs, isValidEmail, isValidUrl, BASE_URL } from "./helpers.ts"

let allLicenses: SpdxLicense[] = []
let allFonts: GoogleFont[] = []
let activeGoogleFontLink: HTMLLinkElement | null = null
let pendingThemeLoad = 0

export function getLicenseName(id: string): string {
    const match = allLicenses.find((l) => l.licenseId === id)
    return match != null ? match.name : id
}

export function isDeprecated(id: string): boolean {
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

export function loadGoogleFont(family: string): void {
    if (activeGoogleFontLink) {
        activeGoogleFontLink.remove()
        activeGoogleFontLink = null
    }
    if (family.length === 0) return
    const font = allFonts.find((f) => f.family === family)
    if (font == null) return
    const url = getGoogleFontsUrl(font.family, font.variants)
    if (url == null) return
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = url
    document.head.appendChild(link)
    activeGoogleFontLink = link
}

export function setAllLicenses(licenses: SpdxLicense[]): void {
    allLicenses = licenses
}

export function setAllFonts(fonts: GoogleFont[]): void {
    allFonts = fonts
}

let licenseAbort: AbortController | null = null

export async function fetchAndRender(
    licenseId: string,
    copyright: string,
    yearStart: number,
    yearEnd: number,
    url: string,
    email: string,
    previewLicenseText: HTMLElement,
    previewTitle: HTMLElement,
): Promise<void> {
    licenseAbort?.abort()
    const controller = new AbortController()
    licenseAbort = controller
    try {
        const rawText = await loadLicenseText(licenseId, controller.signal)
        const yearStr = yearStart !== yearEnd
            ? `${yearStart}\u2013${yearEnd}`
            : String(yearStart)
        const rendered = renderLicenseText(rawText, { year: yearStr, name: copyright, url, email })
        previewTitle.textContent = `${getLicenseName(licenseId)} License`
        previewLicenseText.innerHTML = formatParagraphs(escapeHtml(rendered))
    } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        previewLicenseText.innerHTML = "<p>Failed to load license text.</p>"
    }
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
    yearStartInput: HTMLInputElement
    yearEndInput: HTMLInputElement
    gravatarToggle: HTMLInputElement
    currentYear: number
}): void {
    const {
        getSelectedTheme, fontDropdown, fontSizeInput, fontWeightInput,
        lineHeightInput, letterSpacingInput, licenseDropdown, copyrightInput,
        emailInput, urlInput, yearStartInput, yearEndInput, gravatarToggle, currentYear,
    } = state

    const theme = getSelectedTheme()
    const fontFamily = fontDropdown.getValue()
    const fontSize = fontSizeInput.value.trim()
    const fontWeight = fontWeightInput.value.trim()
    const lineHeight = lineHeightInput.value.trim()
    const letterSpacing = letterSpacingInput.value.trim()
    const licenseId = licenseDropdown.getValue()
    const copyright = copyrightInput.value || "John Doe"
    const email = emailInput.value.trim()
    const url = urlInput.value.trim()
    const yearStart = yearStartInput.value.length > 0 ? parseInt(yearStartInput.value) : currentYear
    const yearEnd = yearEndInput.value.length > 0 ? parseInt(yearEndInput.value) : currentYear
    const showGravatar = gravatarToggle.checked

    const previewTheme = $("preview-theme") as HTMLLinkElement
    const previewContent = $("preview-content")
    const previewCopyright = $("preview-copyright")
    const previewLicenseText = $("preview-license-text")
    const previewTitle = $("preview-title")
    const previewGravatar = $("preview-gravatar")
    const previewGravatarImg = $("preview-gravatar-img") as HTMLImageElement
    const previewUrl = $("preview-url")

    const newHref = `${BASE_URL}themes/${theme}.css`
    if (previewTheme.href !== newHref) {
        const loadId = ++pendingThemeLoad
        const newLink = document.createElement("link")
        newLink.rel = "stylesheet"
        newLink.href = newHref
        newLink.onload = () => {
            if (loadId === pendingThemeLoad) {
                previewTheme.href = newHref
            }
            newLink.remove()
        }
        document.head.appendChild(newLink)
    }

    if (fontFamily.length > 0) {
        loadGoogleFont(fontFamily)
        previewContent.style.setProperty("--lx-font-body", getFontFamily(fontFamily))
    } else {
        loadGoogleFont("")
        previewContent.style.setProperty("--lx-font-body", "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif")
    }

    const fontPreview = $("font-preview")
    const pangram = fontPreview.querySelector<HTMLElement>(".font-preview-pangram")
    const specimen = fontPreview.querySelector<HTMLElement>(".font-preview-specimen")
    if (pangram && specimen) {
        if (fontFamily.length > 0) {
            const fontCss = getFontFamily(fontFamily)
            pangram.style.fontFamily = fontCss
            specimen.style.fontFamily = fontCss
            pangram.style.opacity = "1"
            specimen.style.opacity = "1"
        } else {
            pangram.style.fontFamily = "\"Inter\", sans-serif"
            specimen.style.fontFamily = "\"Inter\", sans-serif"
            pangram.style.opacity = "1"
            specimen.style.opacity = "1"
        }
    }
    if (fontSize.length > 0) {
        previewContent.style.setProperty("--lx-font-size", fontSize)
    } else {
        previewContent.style.setProperty("--lx-font-size", "18px")
    }
    if (fontWeight.length > 0) {
        previewContent.style.setProperty("font-weight", fontWeight)
    } else {
        previewContent.style.removeProperty("font-weight")
    }
    if (lineHeight.length > 0) {
        previewContent.style.setProperty("--lx-line-height", lineHeight)
    } else {
        previewContent.style.setProperty("--lx-line-height", "1.7")
    }
    if (letterSpacing.length > 0) {
        previewContent.style.setProperty("letter-spacing", letterSpacing)
    } else {
        previewContent.style.removeProperty("letter-spacing")
    }

    const show = isDeprecated(licenseId)
    const deprecatedWarning = $("deprecated-warning")
    deprecatedWarning.style.display = show ? "inline-flex" : "none"

    void fetchAndRender(licenseId, copyright, yearStart, yearEnd, url, email, previewLicenseText, previewTitle)

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
    previewCopyright.innerHTML = `Copyright &copy; ${yearDisplay} ${nameHtml}${emailHtml}`

    if (showGravatar && hasEmail) {
        const newSrc = getGravatarUrl(email, 64)
        if (previewGravatarImg.src !== newSrc) {
            previewGravatarImg.src = newSrc
            previewGravatarImg.alt = copyright
        }
        previewGravatar.style.display = "block"
    } else {
        previewGravatar.style.display = "none"
    }

    previewUrl.textContent = `${theme} / ${licenseId}`

    const licenseName = getLicenseName(licenseId)
    const fontLabel = fontDropdown.getValue() || "Inter"

    const summaryTheme = $("summary-theme")
    const summaryFontStyling = $("summary-font-styling")
    const summaryLicense = $("summary-license")
    const summaryIdentity = $("summary-identity")
    summaryTheme.textContent = theme
        .replace(/-(?:dark|light)$/, "")
        .replace(/^\w/, (c) => c.toUpperCase())
        + (theme.endsWith("-light") ? " Light" : " Dark")
    const parts: string[] = []
    if (fontLabel !== "Inter") parts.push(fontLabel)
    if (fontSize.length > 0) parts.push(fontSize)
    summaryFontStyling.textContent = parts.length > 0 ? parts.join(" · ") : "Inter"
    summaryLicense.textContent = licenseName
    summaryIdentity.textContent = copyright + (hasEmail ? ` · ${email.split("@")[1]}` : "")
}
