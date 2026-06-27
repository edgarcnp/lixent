import { escapeHtml } from "./helpers.ts"

export interface DropdownOption {
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
    loadFont?: (family: string) => void
}

export interface DropdownInstance {
    setValue: (value: string) => void
    getValue: () => string
    setOptions: (options: DropdownOption[]) => void
}

const ITEM_HEIGHT = 33
const BUFFER = 7
const PANEL_MAX_HEIGHT = 320

export function createDropdown(config: DropdownConfig): DropdownInstance {
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

    const topSpacer = document.createElement("div")
    topSpacer.className = "virtual-spacer-top"
    const bottomSpacer = document.createElement("div")
    bottomSpacer.className = "virtual-spacer-bottom"

    optionsList.appendChild(topSpacer)
    optionsList.appendChild(bottomSpacer)

    panel.appendChild(searchWrap)
    panel.appendChild(optionsList)
    wrapper.appendChild(trigger)
    wrapper.appendChild(panel)
    config.container.appendChild(wrapper)

    let currentOptions = [...config.options]
    let filteredOptions: DropdownOption[] = []
    const loadedFonts = new Set<string>()

    const fontObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue
            const el = entry.target as HTMLElement
            const font = el.dataset.font
            if (font && !loadedFonts.has(font)) {
                loadedFonts.add(font)
                config.loadFont?.(font)
            }
            fontObserver.unobserve(el)
        }
    }, { root: optionsList, rootMargin: "50px" })

    function renderVirtualList(): void {
        const scrollTop = optionsList.scrollTop
        const panelHeight = Math.min(PANEL_MAX_HEIGHT, (filteredOptions.length * ITEM_HEIGHT) + 8)
        const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER)
        const endIndex = Math.min(
            filteredOptions.length,
            Math.ceil((scrollTop + panelHeight) / ITEM_HEIGHT) + BUFFER,
        )

        topSpacer.style.height = `${(startIndex * ITEM_HEIGHT)}px`
        bottomSpacer.style.height = `${((filteredOptions.length - endIndex) * ITEM_HEIGHT)}px`

        const fragment = document.createDocumentFragment()
        for (let i = startIndex; i < endIndex; i++) {
            const opt = filteredOptions[i]
            const el = document.createElement("div")
            el.className = "custom-dropdown-option"
            if (opt.value === currentValue) el.classList.add("selected")
            el.dataset.value = opt.value

            if (opt.fontPreview) {
                const preview = document.createElement("span")
                preview.className = "option-font-preview"
                preview.textContent = opt.label
                preview.style.fontFamily = opt.fontPreview
                el.dataset.font = opt.label
                fontObserver.observe(el)
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

            fragment.appendChild(el)
        }

        for (const child of [...optionsList.children]) {
            if (child !== topSpacer && child !== bottomSpacer) child.remove()
        }
        optionsList.insertBefore(fragment, bottomSpacer)
    }

    function renderOptions(filter = ""): void {
        const lower = filter.toLowerCase()
        filteredOptions = lower.length > 0
            ? currentOptions.filter((o) => o.label.toLowerCase().includes(lower) || (o.meta?.toLowerCase().includes(lower) ?? false))
            : [...currentOptions]

        if (filteredOptions.length === 0) {
            for (const child of [...optionsList.children]) {
                if (child !== topSpacer && child !== bottomSpacer) child.remove()
            }
            topSpacer.style.height = "0px"
            bottomSpacer.style.height = "0px"
            const empty = document.createElement("div")
            empty.className = "custom-dropdown-empty"
            empty.textContent = "No results found"
            optionsList.insertBefore(empty, bottomSpacer)
            return
        }

        focusedIndex = -1
        optionsList.scrollTop = 0
        renderVirtualList()
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
        const panelHeight = Math.min(PANEL_MAX_HEIGHT, (filteredOptions.length * ITEM_HEIGHT) + 52)
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
        const selected = optionsList.querySelector(".custom-dropdown-option.selected")
        if (selected) {
            selected.scrollIntoView({ block: "nearest" })
            const panelRect = optionsList.getBoundingClientRect()
            const itemRect = selected.getBoundingClientRect()
            const offset = itemRect.top - panelRect.top - (panelRect.height / 2) + (itemRect.height / 2)
            optionsList.scrollTop += offset
        }
        requestAnimationFrame(() => searchInput.focus())
        window.addEventListener("scroll", positionPanel, { passive: true })
        window.addEventListener("resize", positionPanel, { passive: true })
        document.addEventListener("click", onOutsideClick)
        document.addEventListener("keydown", onKeyDown)
    }

    function close(): void {
        isOpen = false
        wrapper.classList.remove("open")
        window.removeEventListener("scroll", positionPanel)
        window.removeEventListener("resize", positionPanel)
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

    optionsList.addEventListener("scroll", () => {
        renderVirtualList()
    }, { passive: true })

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
