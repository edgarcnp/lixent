/**
 * License text fetching and placeholder rendering.
 *
 * Licenses are fetched at build time from the
 * {@link https://github.com/spdx/license-list-data | SPDX license list} on GitHub.
 * No license texts are bundled — this keeps the repo small and always up to date.
 *
 * ## How placeholders work
 *
 * SPDX license texts use placeholders like `<year>`, `<copyright holders>`,
 * `[yyyy]`, `[name of copyright owner]`, etc. This module:
 *
 * 1. **Converts** all SPDX placeholder formats to a canonical `{{year}}` / `{{name}}` form
 * 2. **Renders** the canonical placeholders using values from {@link LixentConfig}
 *
 * URLs and emails in angle brackets (e.g. `<https://.gnu.org>`) are preserved
 * because they don't match any known placeholder pattern.
 *
 * @module
 */

import { readFileSync } from "node:fs"
import { resolve as resolvePath } from "node:path"
import type { LixentConfig } from "./types.ts"
import { LicenseError } from "./errors.ts"

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

/**
 * Fetch the full list of SPDX licenses.
 *
 * Uses a 15-second timeout. Throws if the network request fails.
 * Called at build time in `index.astro` and at runtime in the demo.
 */
async function fetchLicenseList(): Promise<SpdxLicense[]> {
    const response = await fetch(SPDX_LIST_URL, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) {
        throw new LicenseError(
            `[lixent] Failed to fetch SPDX license list: ${response.statusText}`,
            { code: "FETCH_FAILED" },
        )
    }
    const data = await response.json() as SpdxLicenseList
    return data.licenses
}

/**
 * Fetch the raw text of a specific license by its SPDX ID.
 *
 * @param id     - SPDX license identifier (e.g. `"MIT"`, `"GPL-3.0-only"`).
 * @param signal - Optional AbortSignal. Defaults to a 15-second timeout.
 * @returns The raw license text with original placeholders intact.
 * @throws {LicenseError} If the license ID is invalid or the fetch fails.
 */
async function fetchLicenseText(id: string, signal?: AbortSignal): Promise<string> {
    if (!/^[A-Za-z0-9._-]+$/.test(id)) {
        throw new LicenseError(
            `[lixent] Invalid license ID: ${id}`,
            { code: "INVALID_ID", licenseId: id },
        )
    }
    const response = await fetch(`${SPDX_TEXT_BASE}${id}.txt`, {
        signal: signal ?? AbortSignal.timeout(15_000),
    })
    if (!response.ok) {
        throw new LicenseError(
            `[lixent] Failed to fetch license ${id}: ${response.statusText}`,
            { code: "FETCH_FAILED", licenseId: id },
        )
    }
    return response.text()
}

/**
 * Convert all SPDX placeholder formats to canonical `{{year}}` / `{{name}}` form.
 *
 * Handles 12 placeholder patterns across different license families:
 * - MIT-style: `<year>`, `<copyright holders>`, `<name of copyright holder>`, `<copyright holder>`
 * - GPL-style: `<name of author>`, `<program>`, `<owner>`
 * - Apache-style: `[yyyy]`, `[year]`, `[fullname]`, `[copyright holders]`, `[name of copyright owner]`
 *
 * Angle brackets that don't match any placeholder (e.g. `<https://gnu.org>`)
 * are left untouched.
 *
 * @param text - Raw license text from SPDX.
 * @returns License text with canonical `{{year}}` / `{{name}}` placeholders.
 */
function convertPlaceholders(text: string): string {
    return text
        .replace(/<year>/gi, "{{year}}")
        .replace(/<copyright holders>/gi, "{{name}}")
        .replace(/<name of copyright holder>/gi, "{{name}}")
        .replace(/<name of author>/gi, "{{name}}")
        .replace(/<copyright holder>/gi, "{{name}}")
        .replace(/<program>/gi, "{{name}}")
        .replace(/<owner>/gi, "{{name}}")
        .replace(/\[yyyy\]/g, "{{year}}")
        .replace(/\[year\]/g, "{{year}}")
        .replace(/\[fullname\]/g, "{{name}}")
        .replace(/\[copyright holders\]/g, "{{name}}")
        .replace(/\[name of copyright owner\]/g, "{{name}}")
}

/**
 * Render a license text by converting SPDX placeholders and substituting values.
 *
 * Pipeline: raw SPDX text → {@link convertPlaceholders} → replace `{{year}}`, `{{name}}`, `{{url}}`, `{{email}}`.
 *
 * @param text   - Raw license text (or custom license text).
 * @param values - Replacement values for the canonical placeholders.
 * @returns Fully rendered license text ready for HTML output.
 */
export function renderLicenseText(
    text: string,
    values: { year: string, name: string, url?: string, email?: string },
): string {
    const converted = convertPlaceholders(text)
    return converted
        .replace(/\{\{year\}\}/g, values.year)
        .replace(/\{\{name\}\}/g, values.name)
        .replace(/\{\{url\}\}/g, values.url ?? "")
        .replace(/\{\{email\}\}/g, values.email ?? "")
}

/**
 * Resolve the license name and raw text from config.
 *
 * Handles custom licenses (inline or file-based) and SPDX licenses.
 * Returns raw text — rendering is the caller's responsibility.
 *
 * @throws {LicenseError} If the license ID is unknown, the text is missing, or the fetch fails.
 */
export async function resolveLicense(config: LixentConfig): Promise<{ name: string, text: string }> {
    if (config.license === "custom") {
        let customText = config.customLicense?.text ?? ""
        if (config.licenseFile != null && config.licenseFile.length > 0) {
            customText = readFileSync(resolvePath(config.licenseFile), "utf-8")
        }
        if (!customText) {
            throw new LicenseError(
                '[lixent] License is "custom" but no license text was found. Set customLicense.text or licenseFile.',
                { code: "MISSING_TEXT" },
            )
        }
        return {
            name: config.customLicense?.name ?? "Custom License",
            text: customText,
        }
    }

    const [licenses, rawText] = await Promise.all([
        fetchLicenseList(),
        fetchLicenseText(config.license),
    ])

    const match = licenses.find((l) => l.licenseId === config.license)
    if (!match) {
        throw new LicenseError(
            `[lixent] Unknown license "${config.license}". Check your lixent.config.json.`,
            { code: "NOT_FOUND", licenseId: config.license },
        )
    }

    return {
        name: match.name,
        text: rawText,
    }
}
