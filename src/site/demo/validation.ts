/**
 * Lightweight client-side checks used by the demo UI.
 *
 * The build-time config parser is stricter; these only drive warnings.
 */

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
