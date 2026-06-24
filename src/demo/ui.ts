import { getGravatarUrl } from "./gravatar.ts"
import { licenses } from "./licenses.ts"

interface DemoSettings {
    theme: string
    license: string
    copyright: string
    email: string
    url: string
    year: string
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

function convertPlaceholders(text: string, copyright: string, year: number): string {
    return text
        .replace(/\{\{year\}\}/g, String(year))
        .replace(/\{\{name\}\}/g, copyright)
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

function applyMode(mode: "dark" | "light"): void {
    if (mode === "dark") {
        document.documentElement.classList.add("dark")
    } else {
        document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("lixent-demo-mode", mode)

    const modeLabel = $("mode-label")
    const modeIcon = $("mode-icon")
    if (mode === "dark") {
        modeLabel.textContent = "Dark Mode"
        modeIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>'
    } else {
        modeLabel.textContent = "Light Mode"
        modeIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'
    }
}

export function initDemo(): void {
    const themeSelect = $("theme-select") as HTMLSelectElement
    const licenseSelect = $("license-select") as HTMLSelectElement
    const copyrightInput = $("copyright-input") as HTMLInputElement
    const emailInput = $("email-input") as HTMLInputElement
    const urlInput = $("url-input") as HTMLInputElement
    const yearInput = $("year-input") as HTMLInputElement
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

    function updatePreview(): void {
        const theme = themeSelect.value
        const licenseId = licenseSelect.value
        const copyright = copyrightInput.value || "John Doe"
        const email = emailInput.value.trim()
        const url = urlInput.value.trim()
        const year = yearInput.value ? parseInt(yearInput.value) : new Date().getFullYear()
        const showGravatar = gravatarToggle.checked

        previewTheme.href = `/themes/${theme}.css`

        const license = licenses[licenseId]
        const rendered = license != null
            ? convertPlaceholders(license.text, copyright, year)
            : "License text not found"

        previewTitle.textContent = `${license != null ? license.name : licenseId} License`

        const hasUrl = url.length > 0 && isValidUrl(url)
        const hasEmail = email.length > 0 && isValidEmail(email)
        const nameHtml = hasUrl
            ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${copyright}</a>`
            : copyright
        const emailHtml = hasEmail
            ? ` &lt;<a href="mailto:${email}">${email}</a>&gt;`
            : ""
        previewCopyright.innerHTML = `Copyright &copy; ${year} ${nameHtml}${emailHtml}`

        previewLicenseText.innerHTML = formatParagraphs(rendered)

        if (showGravatar && hasEmail) {
            previewGravatar.style.display = "block"
            previewGravatarImg.src = getGravatarUrl(email, 64)
            previewGravatarImg.alt = copyright
        } else {
            previewGravatar.style.display = "none"
        }

        previewUrl.textContent = `${theme} / ${licenseId}`
    }

    function getCurrentSettings(): DemoSettings {
        return {
            theme: themeSelect.value,
            license: licenseSelect.value,
            copyright: copyrightInput.value,
            email: emailInput.value,
            url: urlInput.value,
            year: yearInput.value,
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
        themeSelect.value = "minimal"
        licenseSelect.value = "MIT"
        copyrightInput.value = "John Doe"
        emailInput.value = ""
        urlInput.value = ""
        yearInput.value = String(currentYear)
        gravatarToggle.checked = false
        applyMode(getPreferredMode())
        onControlChange()
    }

    function toggleMode(): void {
        const current = getPreferredMode()
        const next = current === "dark" ? "light" : "dark"
        applyMode(next)
        saveSettings(getCurrentSettings())
    }

    themeSelect.addEventListener("change", onControlChange)
    licenseSelect.addEventListener("change", onControlChange)
    copyrightInput.addEventListener("input", onControlChange)
    emailInput.addEventListener("input", onControlChange)
    urlInput.addEventListener("input", onControlChange)
    yearInput.addEventListener("input", onControlChange)
    gravatarToggle.addEventListener("change", onControlChange)

    utilOpen.addEventListener("click", () => utilMenu.classList.add("open"))
    utilToggle.addEventListener("click", () => utilMenu.classList.remove("open"))
    utilReset.addEventListener("click", resetSettings)
    modeToggle.addEventListener("click", toggleMode)

    const utilCopy = $("util-copy")
    const utilCopyLabel = $("util-copy-label")
    const utilCopyCheck = $("util-copy-check")

    utilCopy.addEventListener("click", () => {
        const config: Record<string, string | boolean> = {
            copyright: copyrightInput.value || "John Doe",
            license: licenseSelect.value,
            theme: themeSelect.value,
        }
        if (emailInput.value.trim()) config.email = emailInput.value.trim()
        if (urlInput.value.trim() && isValidUrl(urlInput.value.trim())) config.url = urlInput.value.trim()
        if (gravatarToggle.checked) config.gravatar = true

        const json = JSON.stringify(config, null, 2)
        void navigator.clipboard.writeText(json).then(() => {
            utilCopyLabel.textContent = "Copied!"
            utilCopyCheck.style.display = "inline-flex"
            setTimeout(() => {
                utilCopyLabel.textContent = "Copy Config"
                utilCopyCheck.style.display = "none"
            }, 2000)
        })
    })

    const currentYear = new Date().getFullYear()

    const saved = loadSettings()
    if (saved.theme) themeSelect.value = saved.theme
    if (saved.license) licenseSelect.value = saved.license
    if (saved.copyright) copyrightInput.value = saved.copyright
    if (saved.email) emailInput.value = saved.email
    if (saved.url) urlInput.value = saved.url
    yearInput.value = saved.year && saved.year.length > 0 ? saved.year : String(currentYear)
    if (saved.gravatar != null) gravatarToggle.checked = saved.gravatar

    applyMode(getPreferredMode())
    onControlChange()
}
