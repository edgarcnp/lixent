export const BASE_URL = document.body.dataset.baseUrl ?? "/"

export function $(id: string): HTMLElement {
    const el = document.getElementById(id)
    if (!el) throw new Error(`Element #${id} not found`)
    return el
}

export function escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;")
}

export function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/[<>"]/.test(value)
}

export function isValidUrl(value: string): boolean {
    if (value.length === 0) return true
    try {
        const parsed = new URL(value)
        return parsed.protocol === "http:" || parsed.protocol === "https:"
    } catch {
        return false
    }
}

export function formatParagraphs(text: string): string {
    return text
        .split(/\n\n+/)
        .map((p) => p.replace(/\n/g, " "))
        .filter((p) => p.trim() !== "")
        .map((p) => `<p>${p}</p>`)
        .join("")
}

export function getPreferredMode(): "dark" | "light" {
    const saved = localStorage.getItem("lixent-demo-mode")
    if (saved === "dark" || saved === "light") return saved
    return "dark"
}

export function debounce<T extends (...args: never[]) => void>(fn: T, wait: number): T {
    let timer: ReturnType<typeof setTimeout>
    return ((...args: unknown[]) => {
        clearTimeout(timer)
        timer = setTimeout(() => fn(...(args as never[])), wait)
    }) as unknown as T
}
