/**
 * Google Fonts integration.
 *
 * Fetches the font catalog from the Google Fonts Developer API
 * ({@link https://developers.google.com/fonts/docs/developer_api | webfonts/v1}).
 * Requires an API key passed via `fetchFontList`.
 *
 * At build time: the catalog is fetched from the `fonts-data` branch
 * and written to `public/fonts.json`.
 *
 * At runtime (demo): the catalog is fetched client-side from `/fonts.json`.
 *
 * @module
 */

/** Base URL for the Google Fonts Developer API. */
export const GOOGLE_FONTS_API_URL = "https://www.googleapis.com/webfonts/v1/webfonts"

/** A single font family from the Google Fonts catalog. */
export interface GoogleFont {
    /** Font family name (e.g. `"Inter"`, `"Merriweather"`). */
    family: string
    /** Available variants/weights (e.g. `["regular", "500", "700", "italic"]`). */
    variants: string[]
    /** CSS category (e.g. `"sans-serif"`, `"serif"`, `"monospace"`, `"display"`, `"handwriting"`). */
    category: string
}

/** Response shape from the Google Fonts Developer API. */
interface GoogleFontsApiResponse {
    items: Array<{
        family: string
        variants: string[]
        category: string
    }>
}

/**
 * Fetch the full list of Google Fonts from the official API.
 *
 * @param apiKey - Google Fonts Developer API key.
 * @returns Sorted list of font families with their variants and categories.
 * @throws If the network request fails or the API returns an error.
 */
export async function fetchFontList(apiKey: string): Promise<GoogleFont[]> {
    const url = `${GOOGLE_FONTS_API_URL}?key=${apiKey}&sort=alpha`
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) {
        throw new Error(`Failed to fetch Google Fonts catalog: ${response.statusText}`)
    }
    const data = await response.json() as GoogleFontsApiResponse
    return data.items.map((item) => ({
        family: item.family,
        variants: item.variants,
        category: item.category,
    }))
}

/**
 * Generate a Google Fonts CSS2 URL for a given font family and variants.
 *
 * @param family   - Font family name (e.g. `"Inter"`).
 * @param variants - Available variants from the catalog (e.g. `["regular", "500", "700"]`).
 *                   Defaults to `["regular"]`.
 * @returns A `https://fonts.googleapis.com/css2?...` URL, or `null` if family is empty.
 *
 * @example
 * ```ts
 * getGoogleFontsUrl("Inter", ["regular", "500", "700"])
 * // → "https://fonts.googleapis.com/css2?family=Inter:wght@500;700&display=swap"
 * ```
 */
export function getGoogleFontsUrl(family: string, variants: string[] = ["regular"]): string | null {
    if (family.length === 0) return null
    if (!/^[A-Za-z0-9 -]+$/.test(family)) return null
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
    const safe = family.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
    return `"${safe}", sans-serif`
}
