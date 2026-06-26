export interface YearInput {
    getYearMode: () => "single" | "range"
    applyConfig: (config: { year?: number, yearRange?: { start: number, end: number } }) => void
}

export function createYearInput(
    yearInput: HTMLInputElement,
    yearStartInput: HTMLInputElement,
    yearEndInput: HTMLInputElement,
    yearModeToggle: HTMLElement,
    yearSingleRow: HTMLElement,
    yearRangeRow: HTMLElement,
    currentYear: number,
    onChange: () => void,
): YearInput {
    function getYearMode(): "single" | "range" {
        const raw = yearModeToggle.querySelector<HTMLElement>(".year-mode-btn.active")?.dataset.mode
        return raw === "range" ? "range" : "single"
    }

    function applyConfig(config: { year?: number, yearRange?: { start: number, end: number } }): void {
        const isYearRange = config.yearRange != null
        const mode = isYearRange ? "range" : "single"
        yearModeToggle.querySelectorAll(".year-mode-btn").forEach((b) => {
            b.classList.toggle("active", (b as HTMLElement).dataset.mode === mode)
        })
        yearSingleRow.style.display = mode === "single" ? "flex" : "none"
        yearRangeRow.style.display = mode === "range" ? "flex" : "none"

        if (isYearRange) {
            yearInput.value = ""
            yearStartInput.value = config.yearRange?.start != null ? String(config.yearRange.start) : ""
            yearEndInput.value = config.yearRange?.end != null ? String(config.yearRange.end) : ""
        } else {
            yearInput.value = config.year != null ? String(config.year) : ""
            yearStartInput.value = ""
            yearEndInput.value = ""
        }
    }

    yearInput.addEventListener("input", onChange)
    yearStartInput.addEventListener("input", () => {
        const start = parseInt(yearStartInput.value)
        const end = parseInt(yearEndInput.value)
        if (!isNaN(start) && !isNaN(end) && start > end) {
            yearEndInput.value = yearStartInput.value
        }
        onChange()
    })
    yearEndInput.addEventListener("input", () => {
        const start = parseInt(yearStartInput.value)
        const end = parseInt(yearEndInput.value)
        if (!isNaN(start) && !isNaN(end) && end < start) {
            yearStartInput.value = yearEndInput.value
        }
        onChange()
    })

    yearModeToggle.addEventListener("click", (e) => {
        const btn = (e.target as HTMLElement).closest(".year-mode-btn")
        if (!(btn instanceof HTMLElement) || !btn.dataset.mode) return
        yearModeToggle.querySelectorAll(".year-mode-btn").forEach((b) => b.classList.remove("active"))
        btn.classList.add("active")
        const mode = btn.dataset.mode
        if (mode === "range") {
            yearStartInput.value ||= String(currentYear - 1)
            yearEndInput.value ||= String(currentYear)
        } else {
            yearInput.value ||= String(currentYear)
        }
        yearSingleRow.style.display = mode === "single" ? "flex" : "none"
        yearRangeRow.style.display = mode === "range" ? "flex" : "none"
        onChange()
    })

    return { getYearMode, applyConfig }
}
