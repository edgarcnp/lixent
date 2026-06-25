export const GOOGLE_FONTS_CATALOG_URL = "https://fonts.grida.co/webfonts.json"

export interface GoogleFont {
    family: string
    variants: string[]
    category: string
}

export interface GoogleFontCatalog {
    items: GoogleFont[]
}

export async function fetchFontList(): Promise<GoogleFont[]> {
    const response = await fetch(GOOGLE_FONTS_CATALOG_URL, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) {
        throw new Error(`Failed to fetch Google Fonts catalog: ${response.statusText}`)
    }
    const data = await response.json() as GoogleFontCatalog
    return data.items
}

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

export function getFontFamily(family: string): string {
    return `"${family}", sans-serif`
}
