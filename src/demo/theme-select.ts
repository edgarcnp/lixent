import { themes } from "../themes/index.ts"
import { DEFAULTS } from "./settings.ts"

export interface ThemeSelect {
    getSelectedTheme: () => string
    setSelectedTheme: (id: string) => void
}

export function createThemeSelect(
    themeGallery: HTMLElement,
    themeModeToggle: HTMLElement | null,
    onChange: () => void,
    onCustomChange?: () => void,
): ThemeSelect {
    let selectedTheme: string = DEFAULTS.theme
    const customThemeInputs = document.getElementById("custom-theme-inputs")
    const themeMap = new Map(themes.map((t) => [t.id, t]))

    function getSelectedTheme(): string {
        return selectedTheme
    }

    function setSelectedTheme(id: string): void {
        selectedTheme = id
        themeGallery.querySelectorAll(".theme-card").forEach((card) => {
            card.classList.toggle("selected", (card as HTMLElement).dataset.theme === id)
        })
        if (id === "custom") {
            if (customThemeInputs) customThemeInputs.style.display = ""
            onCustomChange?.()
            return
        }
        if (customThemeInputs) customThemeInputs.style.display = "none"
        const meta = themeMap.get(id)
        const mode = meta?.dark ? "dark" : "light"
        themeGallery.dataset.mode = mode
        themeModeToggle?.querySelectorAll(".theme-mode-btn").forEach((btn) => {
            btn.classList.toggle("active", (btn as HTMLElement).dataset.mode === mode)
        })
    }

    themeGallery.addEventListener("click", (e) => {
        const card = (e.target as HTMLElement).closest(".theme-card")
        if (card instanceof HTMLElement && card.dataset.theme) {
            setSelectedTheme(card.dataset.theme)
            onChange()
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

            if (selectedTheme === "custom") return

            const currentMeta = themeMap.get(selectedTheme)
            if (currentMeta?.dark === (mode === "dark")) return

            const fallback = themes.find((t) => t.dark === (mode === "dark"))
            if (fallback) {
                setSelectedTheme(fallback.id)
                onChange()
            }
        })
    }

    return { getSelectedTheme, setSelectedTheme }
}
