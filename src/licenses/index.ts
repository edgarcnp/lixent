import type { LixentConfig } from "../lib/types.ts"

import MIT from "../data/licenses/MIT.json"
import Apache20 from "../data/licenses/Apache-2.0.json"
import BSD2Clause from "../data/licenses/BSD-2-Clause.json"
import BSD3Clause from "../data/licenses/BSD-3-Clause.json"
import ISC from "../data/licenses/ISC.json"
import MPL20 from "../data/licenses/MPL-2.0.json"
import GPL20Only from "../data/licenses/GPL-2.0-only.json"
import GPL30Only from "../data/licenses/GPL-3.0-only.json"
import LGPL21Only from "../data/licenses/LGPL-2.1-only.json"
import LGPL30Only from "../data/licenses/LGPL-3.0-only.json"
import AGPL30Only from "../data/licenses/AGPL-3.0-only.json"
import Unlicense from "../data/licenses/Unlicense.json"
import CC010 from "../data/licenses/CC0-1.0.json"
import WTFPL from "../data/licenses/WTFPL.json"
import ZeroBSD from "../data/licenses/0BSD.json"

export interface LicenseData {
    id: string
    name: string
    text: string
}

const licenses: Record<string, LicenseData> = {
    MIT,
    "Apache-2.0": Apache20,
    "BSD-2-Clause": BSD2Clause,
    "BSD-3-Clause": BSD3Clause,
    ISC,
    "MPL-2.0": MPL20,
    "GPL-2.0-only": GPL20Only,
    "GPL-3.0-only": GPL30Only,
    "LGPL-2.1-only": LGPL21Only,
    "LGPL-3.0-only": LGPL30Only,
    "AGPL-3.0-only": AGPL30Only,
    Unlicense,
    "CC0-1.0": CC010,
    WTFPL,
    "0BSD": ZeroBSD,
}

export const CORE_LICENSE_IDS = Object.keys(licenses)

export function getLicense(id: string): LicenseData | undefined {
    return licenses[id]
}

export function isValidLicense(id: string): boolean {
    return id in licenses
}

export function renderLicenseText(text: string, config: LixentConfig): string {
    const year = config.year ?? new Date().getFullYear()
    return text
        .replace(/\{\{year\}\}/g, String(year))
        .replace(/\{\{name\}\}/g, config.copyright)
        .replace(/\{\{url\}\}/g, config.url ?? "")
        .replace(/\{\{email\}\}/g, config.email ?? "")
}

export function getLicenseText(config: LixentConfig): string {
    if (config.license === "custom" && config.customLicense) {
        return renderLicenseText(config.customLicense.text, config)
    }

    const license = getLicense(config.license)
    if (!license) {
        return `License not found: ${config.license}`
    }

    return renderLicenseText(license.text, config)
}

export function getLicenseName(config: LixentConfig): string {
    if (config.license === "custom" && config.customLicense) {
        return config.customLicense.name
    }

    const license = getLicense(config.license)
    return license?.name ?? config.license
}
