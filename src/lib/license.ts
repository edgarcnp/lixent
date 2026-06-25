import type { LixentConfig } from "./types.ts"

export const SPDX_LIST_URL = "https://raw.githubusercontent.com/spdx/license-list-data/main/json/licenses.json"
export const SPDX_TEXT_BASE = "https://raw.githubusercontent.com/spdx/license-list-data/main/text/"

export interface SpdxLicense {
    licenseId: string
    name: string
    isDeprecatedLicenseId: boolean
}

export interface SpdxLicenseList {
    licenses: SpdxLicense[]
}

export async function fetchLicenseList(): Promise<SpdxLicense[]> {
    const response = await fetch(SPDX_LIST_URL, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) {
        throw new Error(`Failed to fetch SPDX license list: ${response.statusText}`)
    }
    const data = await response.json() as SpdxLicenseList
    return data.licenses
}

export async function fetchLicenseText(id: string): Promise<string> {
    const response = await fetch(`${SPDX_TEXT_BASE}${id}.txt`, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) {
        throw new Error(`Failed to fetch license ${id}: ${response.statusText}`)
    }
    return response.text()
}

export function convertPlaceholders(text: string): string {
    return text
        .replace(/<year>/gi, "{{year}}")
        .replace(/<copyright holders>/gi, "{{name}}")
        .replace(/<name of copyright holder>/gi, "{{name}}")
        .replace(/<name of author>/gi, "{{name}}")
        .replace(/<copyright holder>/gi, "{{name}}")
        .replace(/<program>/gi, "{{name}}")
        .replace(/<owner>/g, "{{name}}")
        .replace(/\[yyyy\]/g, "{{year}}")
        .replace(/\[year\]/g, "{{year}}")
        .replace(/\[fullname\]/g, "{{name}}")
        .replace(/\[copyright holders\]/g, "{{name}}")
        .replace(/\[name of copyright owner\]/g, "{{name}}")
}

export function renderLicenseText(text: string, config: LixentConfig): string {
    const year = config.year ?? new Date().getFullYear()
    const converted = convertPlaceholders(text)
    return converted
        .replace(/\{\{year\}\}/g, String(year))
        .replace(/\{\{name\}\}/g, config.copyright)
        .replace(/\{\{url\}\}/g, config.url ?? "")
        .replace(/\{\{email\}\}/g, config.email ?? "")
}

export function getLicenseName(config: LixentConfig): string {
    if (config.license === "custom" && config.customLicense) {
        return config.customLicense.name
    }
    return config.license
}
