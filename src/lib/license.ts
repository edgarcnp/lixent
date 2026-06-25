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

import type { LixentConfig } from "./types.ts"

/** URL for the full SPDX license list (JSON format). */
export const SPDX_LIST_URL = "https://raw.githubusercontent.com/spdx/license-list-data/main/json/licenses.json"

/** Base URL for individual SPDX license text files. Append `{licenseId}.txt`. */
export const SPDX_TEXT_BASE = "https://raw.githubusercontent.com/spdx/license-list-data/main/text/"

/** A single entry from the SPDX license list. */
export interface SpdxLicense {
    /** SPDX identifier (e.g. `"MIT"`, `"Apache-2.0"`). */
    licenseId: string
    /** Human-readable name (e.g. "MIT License"). */
    name: string
    /** Whether this license ID is deprecated in the SPDX standard. */
    isDeprecatedLicenseId: boolean
}

/** Response shape from the SPDX licenses.json endpoint. */
export interface SpdxLicenseList {
    licenses: SpdxLicense[]
}

/**
 * Fetch the full list of SPDX licenses.
 *
 * Uses a 15-second timeout. Throws if the network request fails.
 * Called at build time in `index.astro` and at runtime in the demo.
 */
export async function fetchLicenseList(): Promise<SpdxLicense[]> {
    const response = await fetch(SPDX_LIST_URL, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) {
        throw new Error(`Failed to fetch SPDX license list: ${response.statusText}`)
    }
    const data = await response.json() as SpdxLicenseList
    return data.licenses
}

/**
 * Fetch the raw text of a specific license by its SPDX ID.
 *
 * @param id - SPDX license identifier (e.g. `"MIT"`, `"GPL-3.0-only"`).
 * @returns The raw license text with original placeholders intact.
 */
export async function fetchLicenseText(id: string): Promise<string> {
    const response = await fetch(`${SPDX_TEXT_BASE}${id}.txt`, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) {
        throw new Error(`Failed to fetch license ${id}: ${response.statusText}`)
    }
    return response.text()
}

/**
 * Convert all SPDX placeholder formats to canonical `{{year}}` / `{{name}}` form.
 *
 * Handles 14 placeholder patterns across different license families:
 * - MIT-style: `<year>`, `<copyright holders>`, `<name of copyright holder>`
 * - GPL-style: `<name of author>`, `<program>`, `<owner>`, `<COPYRIGHT HOLDER>`, `<YEAR>`
 * - Apache-style: `[yyyy]`, `[year]`, `[fullname]`, `[copyright holders]`, `[name of copyright owner]`
 *
 * Angle brackets that don't match any placeholder (e.g. `<https://gnu.org>`)
 * are left untouched.
 *
 * @param text - Raw license text from SPDX.
 * @returns License text with canonical `{{year}}` / `{{name}}` placeholders.
 */
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

/**
 * Render a license text by converting SPDX placeholders and substituting config values.
 *
 * Pipeline: raw SPDX text → {@link convertPlaceholders} → replace `{{year}}`, `{{name}}`, `{{url}}`, `{{email}}`.
 *
 * @param text   - Raw license text (or custom license text).
 * @param config - User configuration providing values for placeholders.
 * @returns Fully rendered license text ready for HTML output.
 */
export function renderLicenseText(text: string, config: LixentConfig): string {
    const yearStr = config.yearRange != null
        ? `${config.yearRange.start}\u2013${config.yearRange.end}`
        : String(config.year ?? new Date().getFullYear())
    const converted = convertPlaceholders(text)
    return converted
        .replace(/\{\{year\}\}/g, yearStr)
        .replace(/\{\{name\}\}/g, config.copyright)
        .replace(/\{\{url\}\}/g, config.url ?? "")
        .replace(/\{\{email\}\}/g, config.email ?? "")
}

/**
 * Get the display name of the configured license.
 *
 * @returns The `customLicense.name` if license is `"custom"`, otherwise the SPDX ID.
 */
export function getLicenseName(config: LixentConfig): string {
    if (config.license === "custom" && config.customLicense) {
        return config.customLicense.name
    }
    return config.license
}
