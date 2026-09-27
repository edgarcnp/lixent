/**
 * Browser-side license loading for the demo.
 *
 * Rendering is shared with the build pipeline via `core/license/render.ts`;
 * only the fetching is demo-specific.
 *
 * @module
 */

import type { LixentConfig } from "../../core/config/types.ts"
import { renderLicenseText } from "../../core/license/render.ts"

export type ProjectConfig = Partial<LixentConfig>

/** SPDX list entry as published in the license-list-data JSON. */
export interface SpdxLicense {
    licenseId: string
    name: string
    isDeprecatedLicenseId: boolean
}

interface SpdxLicenseList {
    licenses: SpdxLicense[]
}

const SPDX_LIST_URL = "https://raw.githubusercontent.com/spdx/license-list-data/main/json/licenses.json"
const SPDX_TEXT_BASE = "https://raw.githubusercontent.com/spdx/license-list-data/main/text/"

export async function loadLicenses(): Promise<SpdxLicense[]> {
    const response = await fetch(SPDX_LIST_URL, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) throw new Error(`Failed to fetch SPDX license list: ${response.status}`)
    const data = (await response.json()) as SpdxLicenseList
    return data.licenses
}

export async function loadLicenseText(licenseId: string, signal?: AbortSignal): Promise<string> {
    const response = await fetch(`${SPDX_TEXT_BASE}${licenseId}.txt`, {
        signal: signal ?? AbortSignal.timeout(15_000),
    })
    if (!response.ok) throw new Error(`Failed to fetch license text for ${licenseId}: ${response.status}`)
    return response.text()
}

/** Loads the repo's config, copied into `public/` by demo builds. */
export async function loadProjectConfig(): Promise<ProjectConfig> {
    const base = import.meta.env.BASE_URL
    try {
        const response = await fetch(`${base}lixent.config.json`)
        if (response.ok) {
            const parsed: unknown = await response.json()
            if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
                return { ...parsed }
            }
        }
    } catch {
        // The demo can run without a copied config.
    }
    return {}
}

export { renderLicenseText }
