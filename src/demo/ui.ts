import { getGravatarUrl } from "./gravatar.ts"
import { loadLicenses, loadLicenseText, loadProjectConfig, renderLicenseText } from "./licenses.ts"
import type { SpdxLicense } from "../lib/license.ts"

interface DemoSettings {
    theme: string
    font: string
    license: string
    copyright: string
    email: string
    url: string
    yearStart: string
    yearEnd: string
    gravatar: boolean
    mode: string
}

function $(id: string): HTMLElement {
    const el = document.getElementById(id)
    if (!el) throw new Error(`Element #${id} not found`)
    return el
}

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
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

function saveSettings(settings: DemoSettings): void {
    localStorage.setItem("lixent-demo", JSON.stringify(settings))
}

function loadSettings(): Partial<DemoSettings> {
    const saved = localStorage.getItem("lixent-demo")
    if (!saved) return {}
    try {
        return JSON.parse(saved) as Partial<DemoSettings>
    } catch {
        return {}
    }
}

function getPreferredMode(): "dark" | "light" {
    const saved = localStorage.getItem("lixent-demo-mode")
    if (saved === "dark" || saved === "light") return saved
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark"
    return "light"
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
        btn.classList.add("rotate")
        setTimeout(() => {
            modeIcon.innerHTML = mode === "dark" ? MOON_SVG : SUN_SVG
        }, 200)
        setTimeout(() => btn.classList.remove("rotate"), 400)
    } else {
        modeIcon.innerHTML = mode === "dark" ? MOON_SVG : SUN_SVG
    }
}

function buildConfigJson(settings: DemoSettings): Record<string, string | boolean> {
    const config: Record<string, string | boolean> = {
        copyright: settings.copyright || "John Doe",
        license: settings.license,
        theme: settings.theme,
    }
    if (settings.font.length > 0) config.font = settings.font
    if (settings.email.length > 0) config.email = settings.email
    if (settings.url.length > 0 && isValidUrl(settings.url)) config.url = settings.url
    if (settings.gravatar) config.gravatar = true
    return config
}

let allLicenses: SpdxLicense[] = []

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

let loadingLicense = false

async function fetchAndRender(
    licenseId: string,
    copyright: string,
    yearStart: number,
    yearEnd: number,
    previewLicenseText: HTMLElement,
    previewTitle: HTMLElement,
): Promise<void> {
    if (loadingLicense) return
    loadingLicense = true
    try {
        const rawText = await loadLicenseText(licenseId)
        const rendered = renderLicenseText(rawText, copyright, yearStart, yearEnd)
        previewTitle.textContent = `${getLicenseName(licenseId)} License`
        previewLicenseText.innerHTML = formatParagraphs(rendered)
    } catch {
        previewLicenseText.innerHTML = "<p>Failed to load license text.</p>"
    } finally {
        loadingLicense = false
    }
}

export async function initDemo(): Promise<void> {
    const themeSelect = $("theme-select") as HTMLSelectElement
    const fontSelect = $("font-select") as HTMLSelectElement
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

    const currentYear = new Date().getFullYear()

    try {
        allLicenses = await loadLicenses()
        allLicenses.sort((a, b) => a.name.localeCompare(b.name))
        populateDropdown(allLicenses)
    } catch {
        licenseSelect.innerHTML = '<option value="" selected disabled>Failed to load licenses</option>'
    }

    function updateGravatarWarning(): void {
        const email = emailInput.value.trim()
        const show = gravatarToggle.checked && email.length === 0
        emailWarning.style.display = show ? "flex" : "none"
        emailInput.classList.toggle("warn", show)
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
        const theme = themeSelect.value
        const font = fontSelect.value
        const licenseId = licenseSelect.value
        const copyright = copyrightInput.value || "John Doe"
        const email = emailInput.value.trim()
        const url = urlInput.value.trim()
        const yearStart = yearStartInput.value.length > 0 ? parseInt(yearStartInput.value) : currentYear
        const yearEnd = yearEndInput.value.length > 0 ? parseInt(yearEndInput.value) : currentYear
        const showGravatar = gravatarToggle.checked

        previewTheme.href = `/themes/${theme}.css`

        const previewContent = $("preview-content")
        if (font.length > 0) {
            previewContent.style.setProperty("--lx-font-body", font)
        } else {
            previewContent.style.removeProperty("--lx-font-body")
        }

        updateDeprecatedWarning()

        void fetchAndRender(licenseId, copyright, yearStart, yearEnd, previewLicenseText, previewTitle)

        const hasUrl = url.length > 0 && isValidUrl(url)
        const hasEmail = email.length > 0 && isValidEmail(email)
        const nameHtml = hasUrl
            ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${copyright}</a>`
            : copyright
        const emailHtml = hasEmail
            ? ` &lt;<a href="mailto:${email}">${email}</a>&gt;`
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
    }

    function getCurrentSettings(): DemoSettings {
        return {
            theme: themeSelect.value,
            font: fontSelect.value,
            license: licenseSelect.value,
            copyright: copyrightInput.value,
            email: emailInput.value,
            url: urlInput.value,
            yearStart: yearStartInput.value,
            yearEnd: yearEndInput.value,
            gravatar: gravatarToggle.checked,
            mode: getPreferredMode(),
        }
    }

    function onControlChange(): void {
        updateGravatarWarning()
        updateUrlWarning()
        updatePreview()
        saveSettings(getCurrentSettings())
    }

    function resetSettings(): void {
        localStorage.removeItem("lixent-demo")
        localStorage.removeItem("lixent-demo-mode")
        themeSelect.value = projectConfig.theme ?? "minimal"
        fontSelect.value = projectConfig.font ?? ""
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
        saveSettings(getCurrentSettings())
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

    themeSelect.addEventListener("change", onControlChange)
    fontSelect.addEventListener("change", onControlChange)
    licenseSelect.addEventListener("change", onControlChange)
    copyrightInput.addEventListener("input", onControlChange)
    emailInput.addEventListener("input", onControlChange)
    urlInput.addEventListener("input", onControlChange)
    yearStartInput.addEventListener("input", () => {
        const start = parseInt(yearStartInput.value)
        const end = parseInt(yearEndInput.value)
        if (!isNaN(start) && !isNaN(end) && start > end) {
            yearEndInput.value = yearStartInput.value
        }
        onControlChange()
    })
    yearEndInput.addEventListener("input", () => {
        const start = parseInt(yearStartInput.value)
        const end = parseInt(yearEndInput.value)
        if (!isNaN(start) && !isNaN(end) && end < start) {
            yearStartInput.value = yearEndInput.value
        }
        onControlChange()
    })

    gravatarToggle.addEventListener("change", onControlChange)
    gravatarToggle.parentElement?.querySelector("span")?.addEventListener("click", () => {
        gravatarToggle.checked = !gravatarToggle.checked
        gravatarToggle.dispatchEvent(new Event("change"))
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

    const saved = loadSettings()
    themeSelect.value = saved.theme ?? projectConfig.theme ?? "minimal"
    if (saved.font) fontSelect.value = saved.font
    else if (projectConfig.font) fontSelect.value = projectConfig.font
    licenseSelect.value = saved.license ?? projectConfig.license ?? "MIT"
    copyrightInput.value = saved.copyright ?? projectConfig.copyright ?? "Unknown"
    emailInput.value = saved.email ?? projectConfig.email ?? ""
    urlInput.value = saved.url ?? projectConfig.url ?? ""
    yearStartInput.value = saved.yearStart && saved.yearStart.length > 0 ? saved.yearStart : String(currentYear)
    yearEndInput.value = saved.yearEnd && saved.yearEnd.length > 0 ? saved.yearEnd : String(currentYear)
    if (saved.gravatar != null) gravatarToggle.checked = saved.gravatar
    else if (projectConfig.gravatar != null) gravatarToggle.checked = projectConfig.gravatar
    else gravatarToggle.checked = false

    const savedMode = getPreferredMode()
    applyMode(savedMode)
    onControlChange()
}
