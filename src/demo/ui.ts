import { loadLicenses, loadProjectConfig } from "./licenses.ts"
import type { ProjectConfig } from "./licenses.ts"
import type { GoogleFont } from "../lib/font.ts"
import { $, debounce, getPreferredMode } from "./helpers.ts"
import { createDropdown } from "./dropdown.ts"
import { setAllLicenses, setAllFonts, fontToOption, licenseToOption, updatePreview, initPreviewElements, preloadGoogleFont } from "./preview.ts"
import { buildConfigJson, DEFAULTS, CUSTOM_THEME_DEFAULTS } from "./settings.ts"
import { applyMode, toggleMode } from "./mode.ts"
import { createWarnings } from "./warnings.ts"
import { createThemeSelect } from "./theme-select.ts"
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

    const warnings = createWarnings(emailInput, urlInput, gravatarToggle)
    const { updateGravatarWarning, updateGravatarProfileWarning, updateUrlWarning } = warnings

    function onCustomThemeChange(): void {
        applyCustomThemePreview()
    }

    const { getSelectedTheme, setSelectedTheme } = createThemeSelect(
        themeGallery,
        themeModeToggle,
        onControlChange,
        onCustomThemeChange,
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

    function applyCustomThemePreview(): void {
        const theme = getSelectedTheme()
        if (theme !== "custom") return
        const vars = {
            "--lx-bg": customThemeBg.value || CUSTOM_THEME_DEFAULTS.bg,
            "--lx-text": customThemeText.value || CUSTOM_THEME_DEFAULTS.text,
            "--lx-text-muted": customThemeTextMuted.value || CUSTOM_THEME_DEFAULTS.textMuted,
            "--lx-accent": customThemeAccent.value || CUSTOM_THEME_DEFAULTS.accent,
            "--lx-divider": customThemeBorder.value || CUSTOM_THEME_DEFAULTS.border,
        }
        const previewContent = document.getElementById("preview-content")
        if (previewContent) {
            for (const [key, val] of Object.entries(vars)) {
                previewContent.style.setProperty(key, val)
            }
        }
    }

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
            customLicenseName: customLicenseName.value,
            customLicenseText: customLicenseText.value,
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
            customLicenseName: customLicenseName.value,
            customLicenseText: customLicenseText.value,
            customThemeBg: customThemeBg.value,
            customThemeText: customThemeText.value,
            customThemeTextMuted: customThemeTextMuted.value,
            customThemeAccent: customThemeAccent.value,
            customThemeBorder: customThemeBorder.value,
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
        setTimeout(() => URL.revokeObjectURL(url), 0)
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

    customLicenseName.addEventListener("input", debouncedChange)
    customLicenseText.addEventListener("input", debouncedChange)

    const debouncedCustomTheme = debounce(() => {
        applyCustomThemePreview()
        onControlChange()
    }, 300)
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
            document.querySelectorAll(".accordion.open").forEach((a) => {
                a.classList.remove("open")
                a.querySelector<HTMLElement>(".accordion-header")?.setAttribute("aria-expanded", "false")
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

    function flashButton(btn: HTMLElement, label: HTMLElement, check: HTMLElement, message: string, timer: { id: ReturnType<typeof setTimeout> | null }): void {
        label.textContent = message
        check.style.display = "inline-flex"
        btn.classList.add("flash")
        if (timer.id) clearTimeout(timer.id)
        timer.id = setTimeout(() => {
            label.textContent = message === "Copied!" ? "Copy" : "Download"
            check.style.display = "none"
            btn.classList.remove("flash")
            timer.id = null
        }, 2000)
    }

    utilCopy.addEventListener("click", () => {
        const settings = getCurrentSettings()
        const config: Record<string, unknown> = buildConfigJson(settings)
        const json = JSON.stringify(config, null, 2)
        void navigator.clipboard.writeText(json).then(() => {
            flashButton(utilCopy, utilCopyLabel, utilCopyCheck, "Copied!", copyTimer)
        })
    })

    utilDownload.addEventListener("click", () => {
        downloadConfig()
        flashButton(utilDownload, utilDownloadLabel, utilDownloadCheck, "Downloaded!", downloadTimer)
    })

    function applyProjectConfig(config: ProjectConfig): void {
        setSelectedTheme(config.theme ?? DEFAULTS.theme)
        fontDropdown.setValue(config.font ?? DEFAULTS.font)
        fontSizeInput.value = config.fontSize ?? ""
        fontWeightInput.value = config.fontWeight ?? ""
        lineHeightInput.value = config.lineHeight ?? ""
        letterSpacingInput.value = config.letterSpacing ?? ""
        licenseDropdown.setValue(config.license ?? DEFAULTS.license)
        copyrightInput.value = config.copyright ?? ""
        emailInput.value = config.email ?? ""
        urlInput.value = config.url ?? ""
        applyYearConfig(config)
        gravatarToggle.checked = config.gravatar ?? false

        if (config.license === "custom") {
            customLicenseInputs.style.display = ""
            customLicenseName.value = config.customLicense?.name ?? ""
            customLicenseText.value = config.customLicense?.text ?? ""
        }
        if (config.theme === "custom" && config.customTheme) {
            customThemeBg.value = config.customTheme.bg ?? ""
            customThemeText.value = config.customTheme.text ?? ""
            customThemeTextMuted.value = config.customTheme.textMuted ?? ""
            customThemeAccent.value = config.customTheme.accent ?? ""
            customThemeBorder.value = config.customTheme.border ?? ""
        }
    }

    applyProjectConfig(projectConfig)

    applyMode(getPreferredMode())
    ready = true
    onControlChange()
}
