import { getGravatarUrl } from "./gravatar.ts"
import { loadLicenses, loadProjectConfig } from "./licenses.ts"
import type { GoogleFont } from "../lib/font.ts"
import { $, debounce, isValidEmail, isValidUrl, getPreferredMode } from "./helpers.ts"
import { createDropdown } from "./dropdown.ts"
import {
    setAllLicenses,
    setAllFonts,
    fontToOption,
    licenseToOption,
    updatePreview,
} from "./preview.ts"
import { buildConfigJson } from "./settings.ts"

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

function checkGravatarProfile(email: string): Promise<boolean> {
    return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
        img.src = getGravatarUrl(email, 1, "404")
    })
}

export async function initDemo(): Promise<void> {
    const themeGallery = $("theme-gallery")
    const themeModeToggle = document.getElementById("theme-mode-toggle")
    const fontSizeInput = $("font-size-input") as HTMLInputElement
    const fontWeightInput = $("font-weight-input") as HTMLInputElement
    const lineHeightInput = $("line-height-input") as HTMLInputElement
    const letterSpacingInput = $("letter-spacing-input") as HTMLInputElement
    const copyrightInput = $("copyright-input") as HTMLInputElement
    const emailInput = $("email-input") as HTMLInputElement
    const urlInput = $("url-input") as HTMLInputElement
    const yearInput = $("year-input") as HTMLInputElement
    const yearStartInput = $("year-start-input") as HTMLInputElement
    const yearEndInput = $("year-end-input") as HTMLInputElement
    const yearModeToggle = $("year-mode-toggle")
    const yearSingleRow = $("year-single-row")
    const yearRangeRow = $("year-range-row")
    const gravatarToggle = $("gravatar-toggle") as HTMLInputElement
    const utilOpen = $("util-open")
    const utilToggle = $("util-toggle")
    const utilMenu = document.querySelector<HTMLElement>(".util-menu")
    if (!utilMenu) throw new Error("Element .util-menu not found")
    const utilReset = $("util-reset")
    const modeToggle = $("mode-toggle")
    const emailWarning = $("email-warning")
    const urlWarning = $("url-warning")
    const gravatarWarning = $("gravatar-warning")

    const currentYear = new Date().getFullYear()

    function getSelectedTheme(): string {
        const active = themeGallery.querySelector(".theme-card.selected")
        return (active as HTMLElement | null)?.dataset.theme ?? "minimal-dark"
    }

    function setSelectedTheme(id: string): void {
        themeGallery.querySelectorAll(".theme-card").forEach((card) => {
            card.classList.toggle("selected", (card as HTMLElement).dataset.theme === id)
        })
        const mode = id.endsWith("-light") ? "light" : "dark"
        themeGallery.dataset.mode = mode
        themeModeToggle?.querySelectorAll(".theme-mode-btn").forEach((btn) => {
            btn.classList.toggle("active", (btn as HTMLElement).dataset.mode === mode)
        })
    }

    function updateGravatarWarning(): void {
        const email = emailInput.value.trim()
        const show = gravatarToggle.checked && email.length === 0
        emailWarning.style.display = show ? "flex" : "none"
        emailInput.classList.toggle("warn", show)
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

    const licenseDropdown = createDropdown({
        container: $("license-dropdown"),
        options: [],
        placeholder: "Select license...",
        searchPlaceholder: "Search licenses...",
        onSelect: () => onControlChange(),
    })

    const fontDropdown = createDropdown({
        container: $("font-dropdown"),
        options: [],
        placeholder: "Select font...",
        searchPlaceholder: "Search fonts...",
        onSelect: () => onControlChange(),
    })

    function runUpdatePreview(): void {
        const raw = yearModeToggle.querySelector<HTMLElement>(".year-mode-btn.active")?.dataset.mode
        const yearMode: "single" | "range" = raw === "range" ? "range" : "single"
        updatePreview({
            getSelectedTheme,
            fontDropdown,
            fontSizeInput,
            fontWeightInput,
            lineHeightInput,
            letterSpacingInput,
            licenseDropdown,
            copyrightInput,
            emailInput,
            urlInput,
            yearInput,
            yearStartInput,
            yearEndInput,
            yearMode,
            gravatarToggle,
            currentYear,
        })
    }

    function onControlChange(): void {
        updateGravatarWarning()
        updateUrlWarning()
        runUpdatePreview()
    }

    function getCurrentSettings() {
        const raw = yearModeToggle.querySelector<HTMLElement>(".year-mode-btn.active")?.dataset.mode
        const yearMode: "single" | "range" = raw === "range" ? "range" : "single"
        return {
            theme: getSelectedTheme(),
            font: fontDropdown.getValue(),
            fontSize: fontSizeInput.value,
            fontWeight: fontWeightInput.value,
            lineHeight: lineHeightInput.value,
            letterSpacing: letterSpacingInput.value,
            license: licenseDropdown.getValue(),
            copyright: copyrightInput.value,
            email: emailInput.value,
            url: urlInput.value,
            yearInput: yearInput.value,
            yearStart: yearStartInput.value,
            yearEnd: yearEndInput.value,
            yearMode,
            gravatar: gravatarToggle.checked,
        }
    }

    function toggleMode(): void {
        const current = getPreferredMode()
        const next = current === "dark" ? "light" : "dark"
        applyMode(next)
    }

    function downloadConfig(): void {
        const settings = getCurrentSettings()
        const config: Record<string, unknown> = buildConfigJson(settings)
        const json = JSON.stringify(config, null, 2)
        const blob = new Blob([json], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "lixent.config.json"
        a.click()
        URL.revokeObjectURL(url)
    }

    function resetSettings(): void {
        localStorage.removeItem("lixent-demo-mode")
        setSelectedTheme(projectConfig.theme ?? "minimal-dark")
        fontDropdown.setValue(projectConfig.font ?? "Inter")
        fontSizeInput.value = projectConfig.fontSize ?? ""
        fontWeightInput.value = projectConfig.fontWeight ?? ""
        lineHeightInput.value = projectConfig.lineHeight ?? ""
        letterSpacingInput.value = projectConfig.letterSpacing ?? ""
        licenseDropdown.setValue(projectConfig.license ?? "MIT")
        copyrightInput.value = projectConfig.copyright ?? ""
        emailInput.value = projectConfig.email ?? ""
        urlInput.value = projectConfig.url ?? ""

        const isYearRange = projectConfig.yearRange != null
        const yearMode = isYearRange ? "range" : "single"
        yearModeToggle.querySelectorAll(".year-mode-btn").forEach((b) => {
            b.classList.toggle("active", (b as HTMLElement).dataset.mode === yearMode)
        })
        yearSingleRow.style.display = yearMode === "single" ? "flex" : "none"
        yearRangeRow.style.display = yearMode === "range" ? "flex" : "none"

        if (isYearRange) {
            yearInput.value = ""
            yearStartInput.value = projectConfig.yearRange?.start != null ? String(projectConfig.yearRange.start) : ""
            yearEndInput.value = projectConfig.yearRange?.end != null ? String(projectConfig.yearRange.end) : ""
        } else {
            yearInput.value = projectConfig.year != null ? String(projectConfig.year) : ""
            yearStartInput.value = ""
            yearEndInput.value = ""
        }

        gravatarToggle.checked = projectConfig.gravatar ?? false
        applyMode(getPreferredMode())
        onControlChange()
    }

    try {
        const licenses = await loadLicenses()
        licenses.sort((a, b) => a.name.localeCompare(b.name))
        setAllLicenses(licenses)
        licenseDropdown.setOptions(licenses.map(licenseToOption))
    } catch {
        licenseDropdown.setOptions([{ value: "", label: "Failed to load licenses" }])
    }

    try {
        const res = await fetch("/fonts.json", { signal: AbortSignal.timeout(15_000) })
        if (!res.ok) throw new Error(`fonts.json: ${res.status}`)
        const fonts = ((await res.json()) as { items: GoogleFont[] }).items
        fonts.sort((a, b) => a.family.localeCompare(b.family))
        setAllFonts(fonts)
        fontDropdown.setOptions(fonts.map(fontToOption))
    } catch {
        fontDropdown.setOptions([])
    }

    const debouncedChange = debounce(onControlChange, 300)

    themeGallery.addEventListener("click", (e) => {
        const card = (e.target as HTMLElement).closest(".theme-card")
        if (card instanceof HTMLElement && card.dataset.theme) {
            setSelectedTheme(card.dataset.theme)
            onControlChange()
        }
    })

    if (themeModeToggle) {
        themeModeToggle.addEventListener("click", (e) => {
            const btn = (e.target as HTMLElement).closest(".theme-mode-btn")
            if (!(btn instanceof HTMLElement) || !btn.dataset.mode) return

            themeModeToggle.querySelectorAll(".theme-mode-btn").forEach((b) => b.classList.remove("active"))
            btn.classList.add("active")

            const mode = btn.dataset.mode
            themeGallery.dataset.mode = mode

            const currentId = document.querySelector<HTMLElement>(".theme-card.selected")?.dataset.theme
            const currentBase = currentId?.replace(/-dark$|-light$/, "") ?? "minimal"
            const targetId = `${currentBase}-${mode}`

            const targetCard = themeGallery.querySelector<HTMLElement>(`[data-theme="${targetId}"]`)
            if (targetCard) {
                setSelectedTheme(targetId)
                onControlChange()
            }
        })
    }

    fontSizeInput.addEventListener("input", debouncedChange)
    fontWeightInput.addEventListener("input", debouncedChange)
    lineHeightInput.addEventListener("input", debouncedChange)
    letterSpacingInput.addEventListener("input", debouncedChange)

    copyrightInput.addEventListener("input", debouncedChange)
    yearInput.addEventListener("input", debouncedChange)
    const debouncedGravatarCheck = debounce(() => void updateGravatarProfileWarning(), 500)
    emailInput.addEventListener("input", () => {
        debouncedChange()
        debouncedGravatarCheck()
    })
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

    yearModeToggle.addEventListener("click", (e) => {
        const btn = (e.target as HTMLElement).closest(".year-mode-btn")
        if (!(btn instanceof HTMLElement) || !btn.dataset.mode) return
        yearModeToggle.querySelectorAll(".year-mode-btn").forEach((b) => b.classList.remove("active"))
        btn.classList.add("active")
        const mode = btn.dataset.mode
        if (mode === "range") {
            if (yearStartInput.value.length === 0) yearStartInput.value = String(currentYear - 1)
            if (yearEndInput.value.length === 0) yearEndInput.value = String(currentYear)
        } else {
            if (yearInput.value.length === 0) yearInput.value = String(currentYear)
        }
        yearSingleRow.style.display = mode === "single" ? "flex" : "none"
        yearRangeRow.style.display = mode === "range" ? "flex" : "none"
        onControlChange()
    })

    gravatarToggle.addEventListener("change", () => {
        onControlChange()
        void updateGravatarProfileWarning()
    })
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
        const config: Record<string, unknown> = buildConfigJson(settings)
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

    setSelectedTheme(projectConfig.theme ?? "minimal-dark")
    fontDropdown.setValue(projectConfig.font ?? "Inter")
    fontSizeInput.value = projectConfig.fontSize ?? ""
    fontWeightInput.value = projectConfig.fontWeight ?? ""
    lineHeightInput.value = projectConfig.lineHeight ?? ""
    letterSpacingInput.value = projectConfig.letterSpacing ?? ""
    licenseDropdown.setValue(projectConfig.license ?? "MIT")
    copyrightInput.value = projectConfig.copyright ?? ""
    emailInput.value = projectConfig.email ?? ""
    urlInput.value = projectConfig.url ?? ""

    const isYearRange = projectConfig.yearRange != null
    const yearMode = isYearRange ? "range" : "single"
    yearModeToggle.querySelectorAll(".year-mode-btn").forEach((b) => {
        b.classList.toggle("active", (b as HTMLElement).dataset.mode === yearMode)
    })
    yearSingleRow.style.display = yearMode === "single" ? "flex" : "none"
    yearRangeRow.style.display = yearMode === "range" ? "flex" : "none"

    if (isYearRange) {
        yearInput.value = ""
        yearStartInput.value = projectConfig.yearRange?.start != null ? String(projectConfig.yearRange.start) : ""
        yearEndInput.value = projectConfig.yearRange?.end != null ? String(projectConfig.yearRange.end) : ""
    } else {
        yearInput.value = projectConfig.year != null ? String(projectConfig.year) : ""
        yearStartInput.value = ""
        yearEndInput.value = ""
    }

    if (projectConfig.gravatar != null) gravatarToggle.checked = projectConfig.gravatar
    else gravatarToggle.checked = false

    const savedMode = getPreferredMode()
    applyMode(savedMode)
    onControlChange()
}
