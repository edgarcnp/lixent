/**
 * Google Fonts integration.
 *
 * Fetches the font catalog from {@link https://fonts.grida.co/webfonts.json |
 * fonts.grida.co} — a free, no-API-key mirror of the Google Fonts catalog.
 * This follows the same fetch-only pattern as {@link module:license} uses for SPDX.
 *
 * At build time: the catalog is fetched and the user's chosen font is resolved
 * to a Google Fonts CSS2 URL, then injected as a `<link>` tag.
 *
 * At runtime (demo): the catalog is fetched client-side and fonts are loaded
 * dynamically when the user selects one.
 *
 * @module
 */

/** URL for the Google Fonts catalog (JSON). No API key required. */
export const GOOGLE_FONTS_CATALOG_URL = "https://fonts.grida.co/webfonts.json"

/** A single font family from the Google Fonts catalog. */
export interface GoogleFont {
    /** Font family name (e.g. `"Inter"`, `"Merriweather"`). */
    family: string
    /** Available variants/weights (e.g. `["regular", "500", "700", "italic"]`). */
    variants: string[]
    /** CSS category (e.g. `"sans-serif"`, `"serif"`, `"monospace"`, `"display"`, `"handwriting"`). */
    category: string
}

/** Response shape from the Google Fonts catalog endpoint. */
export interface GoogleFontCatalog {
    items: GoogleFont[]
}

/**
 * Fetch the full list of Google Fonts.
 *
 * Uses a 15-second timeout. Throws if the network request fails.
 */
export async function fetchFontList(): Promise<GoogleFont[]> {
    const response = await fetch(GOOGLE_FONTS_CATALOG_URL, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) {
        throw new Error(`Failed to fetch Google Fonts catalog: ${response.statusText}`)
    }
    const data = await response.json() as GoogleFontCatalog
    return data.items
}

/**
 * Generate a Google Fonts CSS2 URL for a given font family and variants.
 *
 * @param family   - Font family name (e.g. `"Inter"`).
 * @param variants - Available variants from the catalog (e.g. `["regular", "500", "700"]`).
 * @returns A `https://fonts.googleapis.com/css2?...` URL, or `null` if family is empty.
 *
 * @example
 * ```ts
 * getGoogleFontsUrl("Inter", ["regular", "500", "700"])
 * // → "https://fonts.googleapis.com/css2?family=Inter:wght@500;700&display=swap"
 * ```
 */
export function getGoogleFontsUrl(family: string, variants: string[]): string | null {
    if (family.length === 0) return null
    const weightParam = variants
        .filter((v) => v !== "italic" && v !== "regular")
        .map((v) => `@${v}`)
        .join(";")
    const hasRegular = variants.includes("regular")
    const familyParam = hasRegular
        ? `${family.replace(/ /g, "+")}:wght${weightParam.length > 0 ? weightParam : ""}`
        : `${family.replace(/ /g, "+")}:wght@${variants[0] ?? "400"}`
    return `https://fonts.googleapis.com/css2?family=${familyParam}&display=swap`
}

/**
 * Wrap a font family name for use in a CSS `font-family` value.
 *
 * @param family - Font family name (e.g. `"Inter"`).
 * @returns CSS font-family string (e.g. `"Inter", sans-serif`).
 */
export function getFontFamily(family: string): string {
    return `"${family}", sans-serif`
}
