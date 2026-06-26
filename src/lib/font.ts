/**
 * Google Fonts integration.
 *
 * The font catalog is fetched at build time from the `fonts-data` branch
 * and written to `public/fonts.json` by the Astro integration.
 *
 * At runtime (demo): the catalog is fetched client-side from `/fonts.json`.
 *
 * @module
 */

/** A single font family from the Google Fonts catalog. */
export interface GoogleFont {
    /** Font family name (e.g. `"Inter"`, `"Merriweather"`). */
    family: string
    /** Available variants/weights (e.g. `["regular", "500", "700", "italic"]`). */
    variants: string[]
    /** CSS category (e.g. `"sans-serif"`, `"serif"`, `"monospace"`, `"display"`, `"handwriting"`). */
    category: string
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
 * // → "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
 * ```
 */
export function getGoogleFontsUrl(family: string, variants: string[] = ["regular"]): string | null {
    if (family.length === 0) return null
    if (!/^[A-Za-z0-9 -]+$/.test(family)) return null

    const familyName = family.replace(/ /g, "+")

    const weights = [
        ...new Set([
            ...(variants.includes("regular") ? ["400"] : []),
            ...variants.filter((v) => v !== "regular" && v !== "italic"),
        ]),
    ].sort((a, b) => Number(a) - Number(b))

    if (weights.length === 0) {
        return `https://fonts.googleapis.com/css2?family=${familyName}&display=swap`
    }

    return `https://fonts.googleapis.com/css2?family=${familyName}:wght@${weights.join(";")}&display=swap`
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
