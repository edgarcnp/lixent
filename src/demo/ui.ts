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
    return "dark"
}

function debounce<T extends (...args: never[]) => void>(fn: T, wait: number): T {
    let timer: ReturnType<typeof setTimeout>
    return ((...args: unknown[]) => {
        clearTimeout(timer)
        timer = setTimeout(() => fn(...(args as never[])), wait)
    }) as unknown as T
}

interface DropdownOption {
    value: string
    label: string
    meta?: string
    fontPreview?: string
}

interface DropdownConfig {
    container: HTMLElement
    options: DropdownOption[]
    placeholder?: string
    searchPlaceholder?: string
    onSelect: (value: string) => void
}

interface DropdownInstance {
    setValue: (value: string) => void
    getValue: () => string
    setOptions: (options: DropdownOption[]) => void
}

function createDropdown(config: DropdownConfig): DropdownInstance {
    let currentValue = ""
    let isOpen = false
    let focusedIndex = -1

    const wrapper = document.createElement("div")
    wrapper.className = "custom-dropdown"

    const trigger = document.createElement("button")
    trigger.type = "button"
    trigger.className = "custom-dropdown-trigger"
    trigger.innerHTML = `<span class="trigger-label placeholder">${escapeHtml(config.placeholder ?? "Select...")}</span><svg class="trigger-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`

    const panel = document.createElement("div")
    panel.className = "custom-dropdown-panel"

    const searchWrap = document.createElement("div")
    searchWrap.className = "custom-dropdown-search"
    const searchInput = document.createElement("input")
    searchInput.type = "text"
    searchInput.placeholder = config.searchPlaceholder ?? "Search..."
    searchWrap.appendChild(searchInput)

    const optionsList = document.createElement("div")
    optionsList.className = "custom-dropdown-options"

    panel.appendChild(searchWrap)
    panel.appendChild(optionsList)
    wrapper.appendChild(trigger)
    wrapper.appendChild(panel)
    config.container.appendChild(wrapper)

    let currentOptions = [...config.options]

    function renderOptions(filter = ""): void {
        optionsList.innerHTML = ""
        const lower = filter.toLowerCase()
        const filtered = lower.length > 0
            ? currentOptions.filter((o) => o.label.toLowerCase().includes(lower) || (o.meta?.toLowerCase().includes(lower) ?? false))
            : currentOptions

        if (filtered.length === 0) {
            const empty = document.createElement("div")
            empty.className = "custom-dropdown-empty"
            empty.textContent = "No results found"
            optionsList.appendChild(empty)
            return
        }

        focusedIndex = -1
        for (const opt of filtered) {
            const el = document.createElement("div")
            el.className = "custom-dropdown-option"
            if (opt.value === currentValue) el.classList.add("selected")
            el.dataset.value = opt.value

            if (opt.fontPreview) {
                const preview = document.createElement("span")
                preview.className = "option-font-preview"
                preview.textContent = opt.label
                preview.style.fontFamily = opt.fontPreview
                el.appendChild(preview)
            } else {
                const label = document.createElement("span")
                label.className = "option-label"
                label.textContent = opt.label
                el.appendChild(label)
            }

            if (opt.meta) {
                const meta = document.createElement("span")
                meta.className = "option-meta"
                meta.textContent = opt.meta
                el.appendChild(meta)
            }

            el.addEventListener("click", () => {
                selectOption(opt.value)
            })

            optionsList.appendChild(el)
        }
    }

    function selectOption(value: string): void {
        currentValue = value
        const opt = currentOptions.find((o) => o.value === value)
        const label = trigger.querySelector<HTMLElement>(".trigger-label")
        if (!label) return
        if (opt) {
            label.textContent = opt.label
            label.classList.remove("placeholder")
            label.style.fontFamily = opt.fontPreview ?? ""
        } else {
            label.textContent = config.placeholder ?? "Select..."
            label.classList.add("placeholder")
            label.style.fontFamily = ""
        }
        close()
        config.onSelect(value)
    }

    function positionPanel(): void {
        const rect = trigger.getBoundingClientRect()
        const panelHeight = Math.min(320, optionsList.scrollHeight + 52)
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top
        const openUp = spaceBelow < panelHeight && spaceAbove > spaceBelow

        panel.style.width = `${rect.width}px`
        panel.style.left = `${rect.left}px`
        if (openUp) {
            panel.style.top = "auto"
            panel.style.bottom = `${window.innerHeight - rect.top + 4}px`
        } else {
            panel.style.top = `${rect.bottom + 4}px`
            panel.style.bottom = "auto"
        }
    }

    function open(): void {
        isOpen = true
        wrapper.classList.add("open")
        searchInput.value = ""
        renderOptions()
        positionPanel()
        requestAnimationFrame(() => searchInput.focus())
        document.addEventListener("click", onOutsideClick)
        document.addEventListener("keydown", onKeyDown)
    }

    function close(): void {
        isOpen = false
        wrapper.classList.remove("open")
        document.removeEventListener("click", onOutsideClick)
        document.removeEventListener("keydown", onKeyDown)
    }

    function toggle(): void {
        if (isOpen) close()
        else open()
    }

    function onOutsideClick(e: MouseEvent): void {
        if (!wrapper.contains(e.target as Node)) {
            close()
        }
    }

    function onKeyDown(e: KeyboardEvent): void {
        const items = optionsList.querySelectorAll(".custom-dropdown-option")
        if (e.key === "Escape") {
            close()
            return
        }
        if (e.key === "ArrowDown") {
            e.preventDefault()
            focusedIndex = Math.min(focusedIndex + 1, items.length - 1)
            updateFocus(items)
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            focusedIndex = Math.max(focusedIndex - 1, 0)
            updateFocus(items)
        } else if (e.key === "Enter" && focusedIndex >= 0) {
            e.preventDefault()
            const focused = items[focusedIndex] as HTMLElement | undefined
            if (focused?.dataset.value) {
                selectOption(focused.dataset.value)
            }
        }
    }

    function updateFocus(items: NodeListOf<Element>): void {
        items.forEach((el, i) => {
            el.classList.toggle("focused", i === focusedIndex)
        })
        const focused = items[focusedIndex] as HTMLElement | undefined
        if (focused) focused.scrollIntoView({ block: "nearest" })
    }

    trigger.addEventListener("click", (e) => {
        e.stopPropagation()
        toggle()
    })

    searchInput.addEventListener("input", () => {
        renderOptions(searchInput.value)
    })

    searchInput.addEventListener("click", (e) => {
        e.stopPropagation()
    })

    renderOptions()

    return {
        setValue: (value: string) => {
            currentValue = value
            const opt = currentOptions.find((o) => o.value === value)
            const label = trigger.querySelector<HTMLElement>(".trigger-label")
            if (!label) return
            if (opt) {
                label.textContent = opt.label
                label.classList.remove("placeholder")
                label.style.fontFamily = opt.fontPreview ?? ""
            } else {
                label.textContent = config.placeholder ?? "Select..."
                label.classList.add("placeholder")
                label.style.fontFamily = ""
            }
        },
        getValue: () => currentValue,
        setOptions: (options: DropdownOption[]) => {
            currentOptions = [...options]
            renderOptions()
        },
    }
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

function licenseToOption(lic: SpdxLicense): DropdownOption {
    return {
        value: lic.licenseId,
        label: lic.isDeprecatedLicenseId ? `${lic.name} (deprecated)` : lic.name,
    }
}

function fontToOption(font: GoogleFont): DropdownOption {
    const fontCss = getFontFamily(font.family)
    return {
        value: font.family,
        label: font.family,
        meta: font.category,
        fontPreview: fontCss,
    }
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
    const themeModeToggle = document.getElementById("theme-mode-toggle")
    const fontSizeInput = $("font-size-input") as HTMLInputElement
    const fontWeightInput = $("font-weight-input") as HTMLInputElement
    const lineHeightInput = $("line-height-input") as HTMLInputElement
    const letterSpacingInput = $("letter-spacing-input") as HTMLInputElement
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

    const licenseDropdown = createDropdown({
        container: $("license-dropdown"),
        options: [],
        placeholder: "Select license...",
        searchPlaceholder: "Search licenses...",
        onSelect: (value) => {
            void value
            onControlChange()
        },
    })

    const fontDropdown = createDropdown({
        container: $("font-dropdown"),
        options: [{ value: "", label: "Default (from theme)" }],
        placeholder: "Select font...",
        searchPlaceholder: "Search fonts...",
        onSelect: (value) => {
            void value
            onControlChange()
        },
    })

    try {
        allLicenses = await loadLicenses()
        allLicenses.sort((a, b) => a.name.localeCompare(b.name))
        licenseDropdown.setOptions(allLicenses.map(licenseToOption))
    } catch {
        licenseDropdown.setOptions([{ value: "", label: "Failed to load licenses" }])
    }

    try {
        const res = await fetch("/fonts.json", { signal: AbortSignal.timeout(15_000) })
        if (!res.ok) throw new Error(`fonts.json: ${res.status}`)
        allFonts = ((await res.json()) as { items: GoogleFont[] }).items
        allFonts.sort((a, b) => a.family.localeCompare(b.family))
        fontDropdown.setOptions([
            { value: "", label: "Default (from theme)" },
            ...allFonts.map(fontToOption),
        ])
    } catch {
        fontDropdown.setOptions([{ value: "", label: "Failed to load fonts" }])
    }

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
        const show = isDeprecated(licenseDropdown.getValue())
        deprecatedWarning.style.display = show ? "inline-flex" : "none"
    }

    function updatePreview(): void {
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

        const licenseName = getLicenseName(licenseId)
        const fontLabel = fontDropdown.getValue() || "Default"

        const summaryTheme = $("summary-theme")
        const summaryFontStyling = $("summary-font-styling")
        const summaryLicense = $("summary-license")
        const summaryIdentity = $("summary-identity")
        summaryTheme.textContent = theme
            .replace(/-(?:dark|light)$/, "")
            .replace(/^\w/, (c) => c.toUpperCase())
            + (theme.endsWith("-light") ? " Light" : "")
        const parts: string[] = []
        if (fontLabel !== "Default") parts.push(fontLabel)
        if (fontSize.length > 0) parts.push(fontSize)
        summaryFontStyling.textContent = parts.length > 0 ? parts.join(" · ") : "Default"
        summaryLicense.textContent = licenseName
        summaryIdentity.textContent = copyright + (hasEmail ? ` · ${email.split("@")[1]}` : "")
    }

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
            yearStart: yearStartInput.value,
            yearEnd: yearEndInput.value,
            gravatar: gravatarToggle.checked,
        }
    }

    function onControlChange(): void {
        updateGravatarWarning()
        updateUrlWarning()
        updatePreview()
    }

    function resetSettings(): void {
        localStorage.removeItem("lixent-demo-mode")
        setSelectedTheme(projectConfig.theme ?? "minimal-dark")
        fontDropdown.setValue(projectConfig.font ?? "")
        fontSizeInput.value = projectConfig.fontSize ?? ""
        fontWeightInput.value = projectConfig.fontWeight ?? ""
        lineHeightInput.value = projectConfig.lineHeight ?? ""
        letterSpacingInput.value = projectConfig.letterSpacing ?? ""
        licenseDropdown.setValue(projectConfig.license ?? "MIT")
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
    emailInput.addEventListener("input", () => {
        debouncedChange()
        void updateGravatarProfileWarning()
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

    setSelectedTheme(projectConfig.theme ?? "minimal-dark")
    if (projectConfig.font) fontDropdown.setValue(projectConfig.font)
    fontSizeInput.value = projectConfig.fontSize ?? ""
    fontWeightInput.value = projectConfig.fontWeight ?? ""
    lineHeightInput.value = projectConfig.lineHeight ?? ""
    letterSpacingInput.value = projectConfig.letterSpacing ?? ""
    licenseDropdown.setValue(projectConfig.license ?? "MIT")
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
