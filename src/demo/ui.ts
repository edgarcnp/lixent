import { loadLicenses, loadProjectConfig } from "./licenses.ts"
import type { GoogleFont } from "../lib/font.ts"
import { $, debounce, getPreferredMode } from "./helpers.ts"
import { createDropdown } from "./dropdown.ts"
import { setAllLicenses, setAllFonts, fontToOption, licenseToOption, updatePreview } from "./preview.ts"
import { buildConfigJson } from "./settings.ts"
import { applyMode, toggleMode } from "./mode.ts"
import { createWarnings } from "./warnings.ts"
import { createThemeSelect } from "./theme-select.ts"
import { createYearInput } from "./year-input.ts"

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
    const modeToggle = $("mode-toggle")

    const currentYear = new Date().getFullYear()

    const warnings = createWarnings(emailInput, urlInput, gravatarToggle)
    const { updateGravatarWarning, updateGravatarProfileWarning, updateUrlWarning } = warnings

    const { getSelectedTheme, setSelectedTheme } = createThemeSelect(
        themeGallery,
        themeModeToggle,
        onControlChange,
    )

    const { getYearMode, applyConfig: applyYearConfig } = createYearInput(
        yearInput,
        yearStartInput,
        yearEndInput,
        yearModeToggle,
        yearSingleRow,
        yearRangeRow,
        currentYear,
        onControlChange,
    )

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
            yearMode: getYearMode(),
            gravatarToggle,
            currentYear,
        })
    }

    let ready = false

    function onControlChange(): void {
        if (!ready) return
        updateGravatarWarning()
        updateUrlWarning()
        runUpdatePreview()
    }

    function getCurrentSettings() {
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
            yearMode: getYearMode(),
            gravatar: gravatarToggle.checked,
        }
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

    const [projectResult, licenseResult, fontResult] = await Promise.allSettled([
        loadProjectConfig(),
        loadLicenses(),
        fetch("/fonts.json", { signal: AbortSignal.timeout(15_000) })
            .then((r) => { if (!r.ok) throw new Error(`fonts.json: ${r.status}`); return r.json() })
            .then((d) => (d as { items: GoogleFont[] }).items),
    ])

    const projectConfig = projectResult.status === "fulfilled" ? projectResult.value : {}

    if (licenseResult.status === "fulfilled") {
        const licenses = licenseResult.value
        licenses.sort((a, b) => a.name.localeCompare(b.name))
        setAllLicenses(licenses)
        licenseDropdown.setOptions(licenses.map(licenseToOption))
    } else {
        licenseDropdown.setOptions([{ value: "", label: "Failed to load licenses" }])
    }

    if (fontResult.status === "fulfilled") {
        const fonts = fontResult.value
        fonts.sort((a, b) => a.family.localeCompare(b.family))
        setAllFonts(fonts)
        fontDropdown.setOptions(fonts.map(fontToOption))
    } else {
        fontDropdown.setOptions([])
    }

    const debouncedChange = debounce(onControlChange, 300)

    fontSizeInput.addEventListener("input", debouncedChange)
    fontWeightInput.addEventListener("input", debouncedChange)
    lineHeightInput.addEventListener("input", debouncedChange)
    letterSpacingInput.addEventListener("input", debouncedChange)
    copyrightInput.addEventListener("input", debouncedChange)

    const debouncedGravatarCheck = debounce(() => void updateGravatarProfileWarning(), 500)
    emailInput.addEventListener("input", () => {
        debouncedChange()
        debouncedGravatarCheck()
    })
    urlInput.addEventListener("input", debouncedChange)

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
    applyYearConfig(projectConfig)
    gravatarToggle.checked = projectConfig.gravatar ?? false

    applyMode(getPreferredMode())
    ready = true
    onControlChange()
}
