import { resolve } from "node:path"

const MAX_LICENSE_BYTES = 50 * 1024
const SPDX_ID_PATTERN = /^[A-Za-z0-9\-+.]+$/

export const TRUSTED_SPDX_BASE = "https://raw.githubusercontent.com/spdx/license-list-data/main/text/"
export const OUTPUT_DIR = resolve(import.meta.dirname, "../../data/licenses")

export function assertTrustedSource(url: string): void {
    if (!url.startsWith(TRUSTED_SPDX_BASE)) {
        throw new Error(`Untrusted source: ${url}`)
    }
}

export function assertValidPath(filePath: string): void {
    const resolved = resolve(filePath)
    if (!resolved.startsWith(OUTPUT_DIR)) {
        throw new Error(`Path traversal detected: ${filePath}`)
    }
}

export function assertValidLicenseId(id: string): void {
    if (!SPDX_ID_PATTERN.test(id)) {
        throw new Error(`Invalid license ID format: ${id}`)
    }
}

export function assertValidText(text: string, licenseId: string): void {
    if (text.length === 0) {
        throw new Error(`Empty license text for ${licenseId}`)
    }
    if (text.length > MAX_LICENSE_BYTES) {
        throw new Error(`License text for ${licenseId} exceeds ${MAX_LICENSE_BYTES} bytes`)
    }
}

export function convertPlaceholders(text: string): string {
    return text
        .replace(/<year>/g, "{{year}}")
        .replace(/<copyright holders>/g, "{{name}}")
        .replace(/<name of copyright holder>/g, "{{name}}")
        .replace(/\[year\]/g, "{{year}}")
        .replace(/\[name of copyright holder\]/g, "{{name}}")
        .replace(/\[fullname\]/g, "{{name}}")
}
