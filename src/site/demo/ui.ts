import type { GoogleFont } from "../../core/theme/font.ts"
import { createDropdown } from "./dropdown.ts"
import { BASE_URL, $, debounce, getPreferredMode } from "./helpers.ts"
import { loadLicenses, loadProjectConfig, type ProjectConfig } from "./licenses.ts"
import { applyMode, toggleMode } from "./mode.ts"
import {
    fontToOption,
    initPreviewElements,
    licenseToOption,
    preloadGoogleFont,
    setAllFonts,
    setAllLicenses,
    updatePreview,
} from "./preview.ts"
import { buildConfigJson, DEFAULTS, type DemoSettings } from "./settings.ts"
import { createThemeSelect } from "./theme-select.ts"
import { createWarnings } from "./warnings.ts"
import { createYearInput } from "./year-input.ts"

export async function initDemo(): Promise<void> {
    initPreviewElements()

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

    const customLicenseInputs = $("custom-license-inputs")
    const customLicenseName = $("custom-license-name") as HTMLInputElement
    const customLicenseText = $("custom-license-text") as HTMLTextAreaElement
    const customThemeBg = $("custom-theme-bg") as HTMLInputElement
    const customThemeText = $("custom-theme-text") as HTMLInputElement
    const customThemeTextMuted = $("custom-theme-text-muted") as HTMLInputElement
    const customThemeAccent = $("custom-theme-accent") as HTMLInputElement
    const customThemeBorder = $("custom-theme-border") as HTMLInputElement

    const currentYear = new Date().getFullYear()

    const { updateGravatarWarning, updateGravatarProfileWarning, updateUrlWarning } = createWarnings(
        emailInput,
        urlInput,
        gravatarToggle,
    )

    const { getSelectedTheme, setSelectedTheme } = createThemeSelect(themeGallery, themeModeToggle, onControlChange)

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
        onSelect: () => {
            const isCustom = licenseDropdown.getValue() === "custom"
            customLicenseInputs.style.display = isCustom ? "" : "none"
            onControlChange()
        },
    })

    const fontDropdown = createDropdown({
        container: $("font-dropdown"),
        options: [],
        placeholder: "Select font...",
        searchPlaceholder: "Search fonts...",
        onSelect: () => onControlChange(),
        loadFont: preloadGoogleFont,
    })

    function getCurrentSettings(): DemoSettings {
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
            customLicenseName: customLicenseName.value,
            customLicenseText: customLicenseText.value,
            customThemeBg: customThemeBg.value,
            customThemeText: customThemeText.value,
            customThemeTextMuted: customThemeTextMuted.value,
            customThemeAccent: customThemeAccent.value,
            customThemeBorder: customThemeBorder.value,
        }
    }

    function runUpdatePreview(): void {
        updatePreview(getCurrentSettings(), currentYear)
    }

    let ready = false

    function onControlChange(): void {
        if (!ready) return
        updateGravatarWarning()
        updateUrlWarning()
        runUpdatePreview()
    }

    function downloadConfig(): void {
        const json = JSON.stringify(buildConfigJson(getCurrentSettings()), null, 2)
        const blob = new Blob([json], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "lixent.config.json"
        anchor.click()
        setTimeout(() => URL.revokeObjectURL(url), 0)
    }

    const [projectResult, licenseResult, fontResult] = await Promise.allSettled([
        loadProjectConfig(),
        loadLicenses(),
        fetch(`${BASE_URL}fonts.json`, { signal: AbortSignal.timeout(15_000) })
            .then((response) => {
                if (!response.ok) throw new Error(`fonts.json: ${response.status}`)
                return response.json()
            })
            .then((data) => {
                const payload = data as Record<string, unknown>
                const items = payload.items
                return Array.isArray(items) ? items as GoogleFont[] : []
            }),
    ])

    const projectConfig = projectResult.status === "fulfilled" ? projectResult.value : {}

    if (licenseResult.status === "fulfilled") {
        const licenses = licenseResult.value
        licenses.sort((a, b) => a.name.localeCompare(b.name))
        setAllLicenses(licenses)
        const options = licenses.map(licenseToOption)
        options.push({ value: "custom", label: "Custom License" })
        licenseDropdown.setOptions(options)
    } else {
        licenseDropdown.setOptions([
            { value: "", label: "Failed to load licenses" },
            { value: "custom", label: "Custom License" },
        ])
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

    const debouncedGravatarCheck = debounce(() => {
        void updateGravatarProfileWarning()
    }, 500)
    emailInput.addEventListener("input", () => {
        debouncedChange()
        debouncedGravatarCheck()
    })
    urlInput.addEventListener("input", debouncedChange)

    gravatarToggle.addEventListener("change", () => {
        onControlChange()
        void updateGravatarProfileWarning()
    })

    customLicenseName.addEventListener("input", debouncedChange)
    customLicenseText.addEventListener("input", debouncedChange)

    const debouncedCustomTheme = debounce(onControlChange, 300)
    customThemeBg.addEventListener("input", debouncedCustomTheme)
    customThemeText.addEventListener("input", debouncedCustomTheme)
    customThemeTextMuted.addEventListener("input", debouncedCustomTheme)
    customThemeAccent.addEventListener("input", debouncedCustomTheme)
    customThemeBorder.addEventListener("input", debouncedCustomTheme)

    document.querySelectorAll(".accordion-header").forEach((header) => {
        header.addEventListener("click", () => {
            const accordion = header.closest(".accordion")
            if (!accordion) return
            const isOpen = accordion.classList.contains("open")
            document.querySelectorAll(".accordion.open").forEach((openAccordion) => {
                openAccordion.classList.remove("open")
                openAccordion.querySelector<HTMLElement>(".accordion-header")?.setAttribute("aria-expanded", "false")
            })
            if (!isOpen) {
                accordion.classList.add("open")
                header.setAttribute("aria-expanded", "true")
            }
        })
    })

    utilOpen.addEventListener("click", () => utilMenu.classList.add("open"))
    utilToggle.addEventListener("click", () => utilMenu.classList.remove("open"))
    modeToggle.addEventListener("click", toggleMode)

    const utilCopy = $("util-copy")
    const utilCopyLabel = $("util-copy-label")
    const utilCopyCheck = $("util-copy-check")
    const utilDownload = $("util-download")
    const utilDownloadLabel = $("util-download-label")
    const utilDownloadCheck = $("util-download-check")
    const copyTimer = { id: null as ReturnType<typeof setTimeout> | null }
    const downloadTimer = { id: null as ReturnType<typeof setTimeout> | null }

    function flashButton(
        button: HTMLElement,
        label: HTMLElement,
        check: HTMLElement,
        message: string,
        timer: { id: ReturnType<typeof setTimeout> | null },
    ): void {
        label.textContent = message
        check.style.display = "inline-flex"
        button.classList.add("flash")
        if (timer.id) clearTimeout(timer.id)
        timer.id = setTimeout(() => {
            label.textContent = message === "Copied!" ? "Copy" : "Download"
            check.style.display = "none"
            button.classList.remove("flash")
            timer.id = null
        }, 2000)
    }

    utilCopy.addEventListener("click", () => {
        const json = JSON.stringify(buildConfigJson(getCurrentSettings()), null, 2)
        void navigator.clipboard.writeText(json).then(() => {
            flashButton(utilCopy, utilCopyLabel, utilCopyCheck, "Copied!", copyTimer)
        }).catch(() => {
            flashButton(utilCopy, utilCopyLabel, utilCopyCheck, "Failed", copyTimer)
        })
    })

    utilDownload.addEventListener("click", () => {
        downloadConfig()
        flashButton(utilDownload, utilDownloadLabel, utilDownloadCheck, "Downloaded!", downloadTimer)
    })

    function applyProjectConfig(config: ProjectConfig): void {
        setSelectedTheme(config.theme?.preset ?? DEFAULTS.theme)
        fontDropdown.setValue(config.theme?.font ?? DEFAULTS.font)
        fontSizeInput.value = config.theme?.fontSize ?? ""
        fontWeightInput.value = config.theme?.fontWeight ?? ""
        lineHeightInput.value = config.theme?.lineHeight ?? ""
        letterSpacingInput.value = config.theme?.letterSpacing ?? ""
        licenseDropdown.setValue(config.license ?? DEFAULTS.license)
        copyrightInput.value = config.copyright ?? ""
        emailInput.value = config.email ?? ""
        urlInput.value = config.url ?? ""
        applyYearConfig({ year: config.year, yearRange: config.yearRange })
        gravatarToggle.checked = config.gravatar ?? false

        if (config.license === "custom") {
            customLicenseInputs.style.display = ""
            customLicenseName.value = config.customLicense?.name ?? ""
            customLicenseText.value = config.customLicense?.text ?? ""
        }

        const colors = config.theme?.colors
        if (colors !== undefined) {
            customThemeBg.value = colors.bg ?? ""
            customThemeText.value = colors.text ?? ""
            customThemeTextMuted.value = colors.textMuted ?? ""
            customThemeAccent.value = colors.accent ?? ""
            customThemeBorder.value = colors.border ?? ""
        }
    }

    applyProjectConfig(projectConfig)

    applyMode(getPreferredMode())
    ready = true
    onControlChange()
}
