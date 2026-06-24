import type { LixentConfig } from "./types.ts"

export type { LicenseData } from "../../data/licenses/index.ts"
import { licenses } from "../../data/licenses/index.ts"

export { licenses }
export const CORE_LICENSE_IDS = Object.keys(licenses).sort()

export function getLicense(id: string) {
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
