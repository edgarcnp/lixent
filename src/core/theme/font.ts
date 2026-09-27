/**
 * Google Fonts integration.
 *
 * Generates the CSS2 URL for a family and the weights the page actually uses.
 *
 * @module
 */

/**
 * Generates a Google Fonts CSS2 URL for a family and its variants.
 *
 * @returns The URL, or `null` when the family is empty or contains invalid characters.
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
 * Converts a CSS font-weight value to Google Fonts variant strings.
 *
 * Always includes `"regular"` (400) as the base; a different weight is added
 * as an additional variant.
 */
export function cssWeightToVariants(fontWeight?: string): string[] {
    if (fontWeight === undefined || fontWeight.length === 0) return ["regular"]
    const normalized = fontWeight === "bold" ? "700" : fontWeight === "normal" ? "400" : fontWeight
    return normalized === "400" ? ["regular"] : ["regular", normalized]
}
