const MAX_COPYRIGHT_BYTES = 256
const MAX_FONT_BYTES = 128
const MAX_CUSTOM_NAME_BYTES = 256
const MAX_CUSTOM_TEXT_BYTES = 50 * 1024
const ALLOWED_SCHEMES = ["http:", "https:"]
export const CSS_DANGEROUS_PATTERN = /[;{}]|url\s*\(/i

export function assertValidUrl(raw: string): void {
    if (raw.length === 0) return
    let parsed: URL
    try {
        parsed = new URL(raw)
    } catch {
        throw new Error(`Invalid URL: ${raw}`)
    }
    if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
        throw new Error(`URL must use http: or https: protocol, got ${parsed.protocol}`)
    }
}

export function assertValidEmail(raw: string): void {
    if (raw.length === 0) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
        throw new Error(`Invalid email: ${raw}`)
    }
}

export function assertValidFont(raw: string): void {
    if (raw.length === 0) return
    if (raw.length > MAX_FONT_BYTES) {
        throw new Error(`Font value exceeds ${MAX_FONT_BYTES} bytes`)
    }
    if (CSS_DANGEROUS_PATTERN.test(raw)) {
        throw new Error(`Font value contains unsafe characters: ${raw}`)
    }
}

export function assertValidCopyright(raw: string): void {
    if (raw.length > MAX_COPYRIGHT_BYTES) {
        throw new Error(`Copyright exceeds ${MAX_COPYRIGHT_BYTES} bytes`)
    }
    if (/<[a-z/]/i.test(raw)) {
        throw new Error(`Copyright contains HTML tags`)
    }
}

export function assertValidYear(raw: number): void {
    if (!Number.isFinite(raw)) {
        throw new Error(`Year must be a finite number, got ${raw}`)
    }
    if (raw !== Math.floor(raw)) {
        throw new Error(`Year must be an integer, got ${raw}`)
    }
    if (raw < 1900 || raw > 2100) {
        throw new Error(`Year must be between 1900 and 2100, got ${raw}`)
    }
}

export function assertValidCustomName(raw: string): void {
    if (raw.length === 0) {
        throw new Error("Custom license name cannot be empty")
    }
    if (raw.length > MAX_CUSTOM_NAME_BYTES) {
        throw new Error(`Custom license name exceeds ${MAX_CUSTOM_NAME_BYTES} bytes`)
    }
    if (/<[a-z/]/i.test(raw)) {
        throw new Error(`Custom license name contains HTML tags`)
    }
}

export function assertValidCustomText(raw: string): void {
    if (raw.length === 0) {
        throw new Error("Custom license text cannot be empty")
    }
    if (raw.length > MAX_CUSTOM_TEXT_BYTES) {
        throw new Error(`Custom license text exceeds ${MAX_CUSTOM_TEXT_BYTES} bytes`)
    }
}

export function assertValidThemeOverrides(
    overrides: Record<string, string>,
    allowedKeys: readonly string[],
): void {
    for (const [key, value] of Object.entries(overrides)) {
        if (!allowedKeys.includes(key)) {
            throw new Error(`Disallowed CSS variable in themeOverrides: ${key}`)
        }
        if (CSS_DANGEROUS_PATTERN.test(value)) {
            throw new Error(`Unsafe value in themeOverrides for ${key}: ${value}`)
        }
    }
}

const CSS_VALUE_PATTERN = /^[a-zA-Z0-9 .%,+\-/()]+$/

export function assertValidCssValue(value: string, field: string): void {
    if (value.length === 0) return
    if (value.length > 64) {
        throw new Error(`${field} exceeds 64 characters`)
    }
    if (CSS_DANGEROUS_PATTERN.test(value)) {
        throw new Error(`${field} contains unsafe characters`)
    }
    if (!CSS_VALUE_PATTERN.test(value)) {
        throw new Error(`${field} contains invalid characters`)
    }
}
