import { BUILT_IN_THEMES, getTheme } from "../../core/theme/catalog.ts"
import { DEFAULTS } from "./settings.ts"

export interface ThemeSelect {
    getSelectedTheme: () => string
    setSelectedTheme: (id: string) => void
}

function familyOf(id: string): string {
    return id.replace(/-(?:dark|light)$/, "")
}

/** Finds the same theme family in the requested light/dark mode. */
function counterpartOf(id: string, dark: boolean): string | undefined {
    const family = familyOf(id)
    return BUILT_IN_THEMES.find((theme) => familyOf(theme.id) === family && theme.dark === dark)?.id
}

export function createThemeSelect(
    themeGallery: HTMLElement,
    themeModeToggle: HTMLElement | null,
    onChange: () => void,
    onCustomChange?: () => void,
): ThemeSelect {
    let selectedTheme: string = DEFAULTS.theme
    const customThemeInputs = document.getElementById("custom-theme-inputs")

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
        const meta = getTheme(id)
        const mode = meta?.dark === true ? "dark" : "light"
        themeGallery.dataset.mode = mode
        themeModeToggle?.querySelectorAll(".theme-mode-btn").forEach((btn) => {
            btn.classList.toggle("active", (btn as HTMLElement).dataset.mode === mode)
        })
    }

    themeGallery.addEventListener("click", (event) => {
        const card = (event.target as HTMLElement).closest(".theme-card")
        if (card instanceof HTMLElement && card.dataset.theme !== undefined) {
            setSelectedTheme(card.dataset.theme)
            onChange()
        }
    })

    if (themeModeToggle) {
        themeModeToggle.addEventListener("click", (event) => {
            const button = (event.target as HTMLElement).closest(".theme-mode-btn")
            if (!(button instanceof HTMLElement) || button.dataset.mode === undefined) return

            const wantDark = button.dataset.mode === "dark"
            themeModeToggle.querySelectorAll(".theme-mode-btn").forEach((btn) => btn.classList.remove("active"))
            button.classList.add("active")
            themeGallery.dataset.mode = wantDark ? "dark" : "light"

            if (selectedTheme === "custom") return
            if (getTheme(selectedTheme)?.dark === wantDark) return

            const fallback = counterpartOf(selectedTheme, wantDark)
                ?? BUILT_IN_THEMES.find((theme) => theme.dark === wantDark)?.id
            if (fallback !== undefined) {
                setSelectedTheme(fallback)
                onChange()
            }
        })
    }

    return { getSelectedTheme, setSelectedTheme }
}
