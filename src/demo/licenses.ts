import type { LixentConfig } from "../lib/types.ts"

export type { SpdxLicense as LicenseData } from "../lib/license.ts"

export type ProjectConfig = Partial<LixentConfig>

export { fetchLicenseList as loadLicenses } from "../lib/license.ts"
export { fetchLicenseText as loadLicenseText } from "../lib/license.ts"
export { renderLicenseText } from "../lib/license.ts"
export { SPDX_LIST_URL, SPDX_TEXT_BASE } from "../lib/license.ts"

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
