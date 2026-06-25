import {
    fetchLicenseList,
    fetchLicenseText,
    convertPlaceholders,
    SPDX_LIST_URL,
    SPDX_TEXT_BASE,
} from "../lib/license.ts"
import type { SpdxLicense } from "../lib/license.ts"

export type { SpdxLicense as LicenseData }

export async function loadLicenses(): Promise<SpdxLicense[]> {
    return fetchLicenseList()
}

export async function loadLicenseText(id: string): Promise<string> {
    return fetchLicenseText(id)
}

export function renderLicenseText(
    text: string,
    copyright: string,
    year: number,
): string {
    const converted = convertPlaceholders(text)
    return converted
        .replace(/\{\{year\}\}/g, String(year))
        .replace(/\{\{name\}\}/g, copyright)
}

export { SPDX_LIST_URL, SPDX_TEXT_BASE }
