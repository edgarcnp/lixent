import type { LixentConfig } from "../lib/types.ts"
import { renderLicenseText as _renderLicenseText } from "../lib/license.ts"

export type { SpdxLicense as LicenseData } from "../lib/license.ts"

export type ProjectConfig = Partial<LixentConfig>

const SPDX_LIST_URL = "https://raw.githubusercontent.com/spdx/license-list-data/main/json/licenses.json"
const SPDX_TEXT_BASE = "https://raw.githubusercontent.com/spdx/license-list-data/main/text/"

interface SpdxLicense {
    licenseId: string
    name: string
    isDeprecatedLicenseId: boolean
}

interface SpdxLicenseList {
    licenses: SpdxLicense[]
}

export async function loadLicenses(): Promise<SpdxLicense[]> {
    const response = await fetch(SPDX_LIST_URL, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) throw new Error(`Failed to fetch SPDX license list: ${response.status}`)
    const data = await response.json() as SpdxLicenseList
    return data.licenses
}

export async function loadLicenseText(licenseId: string): Promise<string> {
    const response = await fetch(`${SPDX_TEXT_BASE}${licenseId}.txt`, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) throw new Error(`Failed to fetch license text for ${licenseId}: ${response.status}`)
    return response.text()
}

export function renderLicenseText(text: string, config: LixentConfig): string {
    return _renderLicenseText(text, config)
}

export async function loadProjectConfig(): Promise<ProjectConfig> {
    const base = import.meta.env.BASE_URL
    try {
        const response = await fetch(`${base}lixent.config.json`)
        if (response.ok) {
            return await response.json() as ProjectConfig
        }
    } catch { /* config file may not exist */ }
    try {
        const response = await fetch(`${base}package.json`)
        if (response.ok) {
            const pkg = await response.json() as { lixent?: ProjectConfig }
            if (pkg.lixent) return pkg.lixent
        }
    } catch { /* package.json may not exist */ }
    return {}
}
