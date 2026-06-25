import {
    fetchLicenseList,
    convertPlaceholders,
    SPDX_LIST_URL,
    SPDX_TEXT_BASE,
} from "../lib/license.ts"
import type { SpdxLicense } from "../lib/license.ts"

export type { SpdxLicense as LicenseData }

export interface ProjectConfig {
    copyright?: string
    url?: string
    email?: string
    license?: string
    theme?: string
    font?: string
    fontSize?: string
    fontWeight?: string
    lineHeight?: string
    letterSpacing?: string
    gravatar?: boolean
}

export async function loadLicenses(): Promise<SpdxLicense[]> {
    return fetchLicenseList()
}

export async function loadLicenseText(id: string, signal?: AbortSignal): Promise<string> {
    if (!/^[A-Za-z0-9._-]+$/.test(id)) {
        throw new Error(`Invalid license ID: ${id}`)
    }
    const response = await fetch(`${SPDX_TEXT_BASE}${id}.txt`, { signal })
    if (!response.ok) {
        throw new Error(`Failed to fetch license ${id}: ${response.statusText}`)
    }
    return response.text()
}

export async function loadProjectConfig(): Promise<ProjectConfig> {
    try {
        const response = await fetch("/lixent.config.json")
        if (response.ok) {
            return await response.json() as ProjectConfig
        }
    } catch { /* config file may not exist */ }
    try {
        const response = await fetch("/package.json")
        if (response.ok) {
            const pkg = await response.json() as { lixent?: ProjectConfig }
            if (pkg.lixent) return pkg.lixent
        }
    } catch { /* package.json may not exist */ }
    return {}
}

export function renderLicenseText(
    text: string,
    copyright: string,
    yearStart: number,
    yearEnd: number,
): string {
    const yearStr = yearStart !== yearEnd
        ? `${yearStart}\u2013${yearEnd}`
        : String(yearStart)
    const converted = convertPlaceholders(text)
    return converted
        .replace(/\{\{year\}\}/g, yearStr)
        .replace(/\{\{name\}\}/g, copyright)
}

export { SPDX_LIST_URL, SPDX_TEXT_BASE }
