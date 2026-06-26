export interface ThemeSelect {
    getSelectedTheme: () => string
    setSelectedTheme: (id: string) => void
}

export function createThemeSelect(
    themeGallery: HTMLElement,
    themeModeToggle: HTMLElement | null,
    onChange: () => void,
): ThemeSelect {
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

            const currentId = document.querySelector<HTMLElement>(".theme-card.selected")?.dataset.theme
            const currentBase = currentId?.replace(/-dark$|-light$/, "") ?? "minimal"
            const targetId = `${currentBase}-${mode}`

            const targetCard = themeGallery.querySelector<HTMLElement>(`[data-theme="${targetId}"]`)
            if (targetCard) {
                setSelectedTheme(targetId)
                onChange()
            }
        })
    }

    return { getSelectedTheme, setSelectedTheme }
}
