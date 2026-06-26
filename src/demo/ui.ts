import { getGravatarUrl } from "./gravatar.ts"
import { loadLicenses, loadLicenseText, loadProjectConfig, renderLicenseText } from "./licenses.ts"
import { getGoogleFontsUrl, getFontFamily } from "../lib/font.ts"
import type { SpdxLicense } from "../lib/license.ts"
import type { GoogleFont } from "../lib/font.ts"

interface DemoSettings {
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

function $(id: string): HTMLElement {
    const el = document.getElementById(id)
    if (!el) throw new Error(`Element #${id} not found`)
    return el
}

const BASE_URL = document.body.dataset.baseUrl ?? "/"

function escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;")
}

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/[<>"]/.test(value)
}

function isValidUrl(value: string): boolean {
    if (value.length === 0) return true
    try {
        const parsed = new URL(value)
        return parsed.protocol === "http:" || parsed.protocol === "https:"
    } catch {
        return false
    }
}

function formatParagraphs(text: string): string {
    return text
        .split(/\n\n+/)
        .map((p) => p.replace(/\n/g, " "))
        .filter((p) => p.trim() !== "")
        .map((p) => `<p>${p}</p>`)
        .join("")
}

function getPreferredMode(): "dark" | "light" {
    const saved = localStorage.getItem("lixent-demo-mode")
    if (saved === "dark" || saved === "light") return saved
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark"
    return "light"
}

function debounce<T extends (...args: never[]) => void>(fn: T, wait: number): T {
    let timer: ReturnType<typeof setTimeout>
    return ((...args: unknown[]) => {
        clearTimeout(timer)
        timer = setTimeout(() => fn(...(args as never[])), wait)
    }) as unknown as T
}

const SUN_SVG = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'
const MOON_SVG = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'

function applyMode(mode: "dark" | "light"): void {
    if (mode === "dark") {
        document.documentElement.classList.add("dark")
    } else {
        document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("lixent-demo-mode", mode)

    const modeIcon = $("mode-icon")
    const btn = modeIcon.closest("button")
    if (btn) {
        btn.classList.remove("rotate")
        void btn.offsetWidth
        btn.classList.add("rotate")
        setTimeout(() => {
            modeIcon.innerHTML = mode === "dark" ? MOON_SVG : SUN_SVG
        }, 200)
        setTimeout(() => btn.classList.remove("rotate"), 400)
    } else {
        modeIcon.innerHTML = mode === "dark" ? MOON_SVG : SUN_SVG
    }
}

function buildConfigJson(settings: DemoSettings): Record<string, unknown> {
    const config: Record<string, unknown> = {
        copyright: settings.copyright || "John Doe",
        license: settings.license,
        theme: settings.theme,
    }
    if (settings.font.length > 0) config.font = settings.font
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

let allLicenses: SpdxLicense[] = []
let allFonts: GoogleFont[] = []
let activeGoogleFontLink: HTMLLinkElement | null = null

function getLicenseName(id: string): string {
    const match = allLicenses.find((l) => l.licenseId === id)
    return match != null ? match.name : id
}

function isDeprecated(id: string): boolean {
    const match = allLicenses.find((l) => l.licenseId === id)
    return match?.isDeprecatedLicenseId === true
}

function populateDropdown(sorted: SpdxLicense[]): void {
    const licenseSelect = $("license-select") as HTMLSelectElement
    licenseSelect.innerHTML = ""
    const optgroup = document.createElement("optgroup")
    optgroup.label = "Licenses"
    for (const lic of sorted) {
        const opt = document.createElement("option")
        opt.value = lic.licenseId
        const label = lic.isDeprecatedLicenseId
            ? `${lic.name} (deprecated)`
            : lic.name
        opt.textContent = label
        optgroup.appendChild(opt)
    }
    licenseSelect.appendChild(optgroup)
}

function populateFontDropdown(fonts: GoogleFont[]): void {
    const fontSelect = $("font-select") as HTMLSelectElement
    fontSelect.innerHTML = ""
    const defaultOpt = document.createElement("option")
    defaultOpt.value = ""
    defaultOpt.textContent = "Default (from theme)"
    defaultOpt.selected = true
    fontSelect.appendChild(defaultOpt)
    const optgroup = document.createElement("optgroup")
    optgroup.label = "Google Fonts"
    for (const font of fonts) {
        const opt = document.createElement("option")
        opt.value = font.family
        opt.textContent = `${font.family} (${font.category})`
        optgroup.appendChild(opt)
    }
    fontSelect.appendChild(optgroup)
}

function loadGoogleFont(family: string): void {
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

let licenseAbort: AbortController | null = null

async function fetchAndRender(
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

export async function initDemo(): Promise<void> {
    const themeGallery = $("theme-gallery")
    const fontSelect = $("font-select") as HTMLSelectElement
    const fontSizeInput = $("font-size-input") as HTMLInputElement
    const fontWeightInput = $("font-weight-input") as HTMLInputElement
    const lineHeightInput = $("line-height-input") as HTMLInputElement
    const letterSpacingInput = $("letter-spacing-input") as HTMLInputElement
    const licenseSelect = $("license-select") as HTMLSelectElement
    const copyrightInput = $("copyright-input") as HTMLInputElement
    const emailInput = $("email-input") as HTMLInputElement
    const urlInput = $("url-input") as HTMLInputElement
    const yearStartInput = $("year-start-input") as HTMLInputElement
    const yearEndInput = $("year-end-input") as HTMLInputElement
    const gravatarToggle = $("gravatar-toggle") as HTMLInputElement
    const previewTheme = $("preview-theme") as HTMLLinkElement
    const previewTitle = $("preview-title")
    const previewCopyright = $("preview-copyright")
    const previewLicenseText = $("preview-license-text")
    const previewGravatar = $("preview-gravatar")
    const previewGravatarImg = $("preview-gravatar-img") as HTMLImageElement
    const utilOpen = $("util-open")
    const utilToggle = $("util-toggle")
    const utilMenu = document.querySelector<HTMLElement>(".util-menu")
    if (!utilMenu) throw new Error("Element .util-menu not found")
    const utilReset = $("util-reset")
    const previewUrl = $("preview-url")
    const modeToggle = $("mode-toggle")
    const emailWarning = $("email-warning")
    const urlWarning = $("url-warning")
    const deprecatedWarning = $("deprecated-warning")
    const gravatarWarning = $("gravatar-warning")

    const currentYear = new Date().getFullYear()

    try {
        allLicenses = await loadLicenses()
        allLicenses.sort((a, b) => a.name.localeCompare(b.name))
        populateDropdown(allLicenses)
    } catch {
        licenseSelect.innerHTML = '<option value="" selected disabled>Failed to load licenses</option>'
    }

    try {
        const res = await fetch("/fonts.json", { signal: AbortSignal.timeout(15_000) })
        if (!res.ok) throw new Error(`fonts.json: ${res.status}`)
        allFonts = ((await res.json()) as { items: GoogleFont[] }).items
        allFonts.sort((a, b) => a.family.localeCompare(b.family))
        populateFontDropdown(allFonts)
    } catch {
        fontSelect.innerHTML = '<option value="" selected disabled>Failed to load fonts</option>'
    }

    function getSelectedTheme(): string {
        const active = themeGallery.querySelector(".theme-card.selected")
        return (active as HTMLElement | null)?.dataset.theme ?? "minimal"
    }

    function setSelectedTheme(id: string): void {
        themeGallery.querySelectorAll(".theme-card").forEach((card) => {
            card.classList.toggle("selected", (card as HTMLElement).dataset.theme === id)
        })
    }

    function updateGravatarWarning(): void {
        const email = emailInput.value.trim()
        const show = gravatarToggle.checked && email.length === 0
        emailWarning.style.display = show ? "flex" : "none"
        emailInput.classList.toggle("warn", show)
    }

    function checkGravatarProfile(email: string): Promise<boolean> {
        return new Promise((resolve) => {
            const img = new Image()
            img.onload = () => resolve(true)
            img.onerror = () => resolve(false)
            img.src = getGravatarUrl(email, 1, "404")
        })
    }

    async function updateGravatarProfileWarning(): Promise<void> {
        const email = emailInput.value.trim()
        if (!gravatarToggle.checked || !isValidEmail(email)) {
            gravatarWarning.style.display = "none"
            return
        }
        const exists = await checkGravatarProfile(email)
        gravatarWarning.style.display = exists ? "none" : "block"
    }

    function updateUrlWarning(): void {
        const url = urlInput.value.trim()
        const show = url.length > 0 && !isValidUrl(url)
        urlWarning.style.display = show ? "flex" : "none"
        urlInput.classList.toggle("warn", show)
    }

    function updateDeprecatedWarning(): void {
        const show = isDeprecated(licenseSelect.value)
        deprecatedWarning.style.display = show ? "inline-flex" : "none"
    }

    function updatePreview(): void {
        const theme = getSelectedTheme()
        const fontFamily = fontSelect.value
        const fontSize = fontSizeInput.value.trim()
        const fontWeight = fontWeightInput.value.trim()
        const lineHeight = lineHeightInput.value.trim()
        const letterSpacing = letterSpacingInput.value.trim()
        const licenseId = licenseSelect.value
        const copyright = copyrightInput.value || "John Doe"
        const email = emailInput.value.trim()
        const url = urlInput.value.trim()
        const yearStart = yearStartInput.value.length > 0 ? parseInt(yearStartInput.value) : currentYear
        const yearEnd = yearEndInput.value.length > 0 ? parseInt(yearEndInput.value) : currentYear
        const showGravatar = gravatarToggle.checked

        previewTheme.href = `${BASE_URL}themes/${theme}.css`

        const previewContent = $("preview-content")
        if (fontFamily.length > 0) {
            loadGoogleFont(fontFamily)
            previewContent.style.setProperty("--lx-font-body", getFontFamily(fontFamily))
        } else {
            loadGoogleFont("")
            previewContent.style.removeProperty("--lx-font-body")
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
                pangram.style.fontFamily = ""
                specimen.style.fontFamily = ""
                pangram.style.opacity = "0.5"
                specimen.style.opacity = "0.5"
            }
        }
        if (fontSize.length > 0) {
            previewContent.style.setProperty("--lx-font-size", fontSize)
        } else {
            previewContent.style.removeProperty("--lx-font-size")
        }
        if (fontWeight.length > 0) {
            previewContent.style.setProperty("font-weight", fontWeight)
        } else {
            previewContent.style.removeProperty("font-weight")
        }
        if (lineHeight.length > 0) {
            previewContent.style.setProperty("--lx-line-height", lineHeight)
        } else {
            previewContent.style.removeProperty("--lx-line-height")
        }
        if (letterSpacing.length > 0) {
            previewContent.style.setProperty("letter-spacing", letterSpacing)
        } else {
            previewContent.style.removeProperty("letter-spacing")
        }

        updateDeprecatedWarning()

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

        const pillContent = $("pill-content")
        const licenseName = getLicenseName(licenseId)
        const fontLabel = fontSelect.value || "Default"
        const yearLabel = yearStart !== yearEnd ? `${yearStart}–${yearEnd}` : String(yearStart)
        pillContent.innerHTML = `${escapeHtml(licenseName)} <span class="pill-sep">·</span> ${escapeHtml(copyright)} <span class="pill-sep">·</span> ${yearLabel} <span class="pill-sep">·</span> ${escapeHtml(theme)} <span class="pill-sep">·</span> ${escapeHtml(fontLabel)}`

        const summaryThemeFont = $("summary-theme-font")
        const summaryLicense = $("summary-license")
        const summaryIdentity = $("summary-identity")
        const summaryStyling = $("summary-styling")
        summaryThemeFont.textContent = `${theme} · ${fontLabel}`
        summaryLicense.textContent = licenseName
        summaryIdentity.textContent = copyright + (hasEmail ? ` · ${email.split("@")[1]}` : "")
        const stylingParts: string[] = []
        if (fontSize.length > 0) stylingParts.push(fontSize)
        if (fontWeight.length > 0) stylingParts.push(fontWeight)
        summaryStyling.textContent = stylingParts.length > 0 ? stylingParts.join(" · ") : "Defaults"
    }

    function getCurrentSettings(): DemoSettings {
        return {
            theme: getSelectedTheme(),
            font: fontSelect.value,
            fontSize: fontSizeInput.value,
            fontWeight: fontWeightInput.value,
            lineHeight: lineHeightInput.value,
            letterSpacing: letterSpacingInput.value,
            license: licenseSelect.value,
            copyright: copyrightInput.value,
            email: emailInput.value,
            url: urlInput.value,
            yearStart: yearStartInput.value,
            yearEnd: yearEndInput.value,
            gravatar: gravatarToggle.checked,
        }
    }

    function onControlChange(): void {
        updateGravatarWarning()
        updateUrlWarning()
        updatePreview()
        void updateGravatarProfileWarning()
    }

    function resetSettings(): void {
        localStorage.removeItem("lixent-demo-mode")
        setSelectedTheme(projectConfig.theme ?? "minimal")
        fontSelect.value = projectConfig.font ?? ""
        fontSizeInput.value = projectConfig.fontSize ?? ""
        fontWeightInput.value = projectConfig.fontWeight ?? ""
        lineHeightInput.value = projectConfig.lineHeight ?? ""
        letterSpacingInput.value = projectConfig.letterSpacing ?? ""
        licenseSelect.value = projectConfig.license ?? "MIT"
        copyrightInput.value = projectConfig.copyright ?? "Unknown"
        emailInput.value = projectConfig.email ?? ""
        urlInput.value = projectConfig.url ?? ""
        yearStartInput.value = String(currentYear)
        yearEndInput.value = String(currentYear)
        gravatarToggle.checked = projectConfig.gravatar ?? false
        applyMode(getPreferredMode())
        onControlChange()
    }

    function toggleMode(): void {
        const current = getPreferredMode()
        const next = current === "dark" ? "light" : "dark"
        applyMode(next)
    }

    function downloadConfig(): void {
        const settings = getCurrentSettings()
        const config = buildConfigJson(settings)
        const json = JSON.stringify(config, null, 2)
        const blob = new Blob([json], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "lixent.config.json"
        a.click()
        URL.revokeObjectURL(url)
    }

    const debouncedChange = debounce(onControlChange, 300)

    themeGallery.addEventListener("click", (e) => {
        const card = (e.target as HTMLElement).closest(".theme-card")
        if (card instanceof HTMLElement && card.dataset.theme) {
            setSelectedTheme(card.dataset.theme)
            onControlChange()
        }
    })
    fontSelect.addEventListener("change", onControlChange)
    fontSizeInput.addEventListener("input", debouncedChange)
    fontWeightInput.addEventListener("input", debouncedChange)
    lineHeightInput.addEventListener("input", debouncedChange)
    letterSpacingInput.addEventListener("input", debouncedChange)
    licenseSelect.addEventListener("change", onControlChange)
    copyrightInput.addEventListener("input", debouncedChange)
    emailInput.addEventListener("input", debouncedChange)
    urlInput.addEventListener("input", debouncedChange)
    yearStartInput.addEventListener("input", () => {
        const start = parseInt(yearStartInput.value)
        const end = parseInt(yearEndInput.value)
        if (!isNaN(start) && !isNaN(end) && start > end) {
            yearEndInput.value = yearStartInput.value
        }
        debouncedChange()
    })
    yearEndInput.addEventListener("input", () => {
        const start = parseInt(yearStartInput.value)
        const end = parseInt(yearEndInput.value)
        if (!isNaN(start) && !isNaN(end) && end < start) {
            yearStartInput.value = yearEndInput.value
        }
        debouncedChange()
    })

    gravatarToggle.addEventListener("change", onControlChange)
    gravatarToggle.parentElement?.querySelector("span")?.addEventListener("click", () => {
        gravatarToggle.checked = !gravatarToggle.checked
        gravatarToggle.dispatchEvent(new Event("change"))
    })

    document.querySelectorAll(".accordion-header").forEach((header) => {
        header.addEventListener("click", () => {
            const accordion = header.closest(".accordion")
            if (!accordion) return
            const isOpen = accordion.classList.contains("open")
            accordion.classList.toggle("open")
            header.setAttribute("aria-expanded", String(!isOpen))
        })
    })

    const summaryPill = $("summary-pill")
    summaryPill.addEventListener("click", () => {
        const settings = getCurrentSettings()
        const config = buildConfigJson(settings)
        const json = JSON.stringify(config, null, 2)
        void navigator.clipboard.writeText(json).then(() => {
            const pillContent = $("pill-content")
            const original = pillContent.innerHTML
            pillContent.textContent = "Copied!"
            setTimeout(() => {
                pillContent.innerHTML = original
            }, 2000)
        })
    })

    utilOpen.addEventListener("click", () => utilMenu.classList.add("open"))
    utilToggle.addEventListener("click", () => utilMenu.classList.remove("open"))
    utilReset.addEventListener("click", resetSettings)
    modeToggle.addEventListener("click", toggleMode)

    const utilCopy = $("util-copy")
    const utilCopyLabel = $("util-copy-label")
    const utilCopyCheck = $("util-copy-check")
    const utilDownload = $("util-download")

    utilCopy.addEventListener("click", () => {
        const settings = getCurrentSettings()
        const config = buildConfigJson(settings)
        const json = JSON.stringify(config, null, 2)
        void navigator.clipboard.writeText(json).then(() => {
            utilCopyLabel.textContent = "Copied!"
            utilCopyCheck.style.display = "inline-flex"
            setTimeout(() => {
                utilCopyLabel.textContent = "Copy"
                utilCopyCheck.style.display = "none"
            }, 2000)
        })
    })

    utilDownload.addEventListener("click", downloadConfig)

    const projectConfig = await loadProjectConfig()

    setSelectedTheme(projectConfig.theme ?? "minimal")
    if (projectConfig.font) fontSelect.value = projectConfig.font
    fontSizeInput.value = projectConfig.fontSize ?? ""
    fontWeightInput.value = projectConfig.fontWeight ?? ""
    lineHeightInput.value = projectConfig.lineHeight ?? ""
    letterSpacingInput.value = projectConfig.letterSpacing ?? ""
    licenseSelect.value = projectConfig.license ?? "MIT"
    copyrightInput.value = projectConfig.copyright ?? "Unknown"
    emailInput.value = projectConfig.email ?? ""
    urlInput.value = projectConfig.url ?? ""
    yearStartInput.value = String(currentYear)
    yearEndInput.value = String(currentYear)
    if (projectConfig.gravatar != null) gravatarToggle.checked = projectConfig.gravatar
    else gravatarToggle.checked = false

    const savedMode = getPreferredMode()
    applyMode(savedMode)
    onControlChange()
}
