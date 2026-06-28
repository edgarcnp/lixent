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
 * Convert a CSS font-weight value to Google Fonts variant strings.
 *
 * Always includes `"regular"` (400) as the base. If the configured weight
 * differs from 400, it is added as an additional variant.
 *
 * @param fontWeight - CSS font-weight value (e.g. `"700"`, `"bold"`, `"normal"`).
 * @returns Array of Google Fonts variant strings (e.g. `["regular", "700"]`).
 *
 * @example
 * ```ts
 * cssWeightToVariants("700")   // → ["regular", "700"]
 * cssWeightToVariants("bold")  // → ["regular", "700"]
 * cssWeightToVariants("400")   // → ["regular"]
 * cssWeightToVariants()        // → ["regular"]
 * ```
 */
export function cssWeightToVariants(fontWeight?: string): string[] {
    if (fontWeight == null || fontWeight.length === 0) return ["regular"]
    let normalized: string
    if (fontWeight === "bold") {
        normalized = "700"
    } else if (fontWeight === "normal") {
        normalized = "400"
    } else {
        normalized = fontWeight
    }
    return normalized === "400" ? ["regular"] : ["regular", normalized]
}
