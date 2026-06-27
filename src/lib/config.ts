/**
 * Configuration loading and validation.
 *
 * Reads `lixent.config.json` (preferred) or the `"lixent"` field in
 * `package.json`, applies defaults, and runs security validation.
 *
 * ## Config priority
 * 1. `lixent.config.json` in the project root
 * 2. `"lixent"` field in `package.json`
 * 3. Hardcoded defaults (`copyright: "Unknown"`, `license: "MIT"`, `theme: "minimal"`)
 *
 * ## Security
 * All user-provided values are validated at load time. URL, email, font,
 * copyright, year, custom license fields, and theme overrides are checked
 * for length, format, and dangerous patterns (CSS injection, HTML tags).
 *
 * @module
 */

import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import type { LixentConfig } from "./types.ts"
import { isValidTheme, THEME_VARIABLES } from "../themes/index.ts"
import {
    assertValidUrl,
    assertValidEmail,
    assertValidFont,
    assertValidCopyright,
    assertValidYear,
    assertValidCustomName,
    assertValidCustomText,
    assertValidThemeOverrides,
    assertValidCssValue,
    assertValidCustomTheme,
} from "./validation.ts"

const CONFIG_FILE = "lixent.config.json"

/**
 * Shape of the `"lixent"` field inside `package.json`.
 * Mirrors {@link LixentConfig} but with all fields optional since
 * `package.json` is a fallback, not the primary config source.
 */
interface PackageJsonLixent {
    copyright?: string
    url?: string
    email?: string
    license?: string
    customLicense?: { name?: string, text?: string }
    licenseFile?: string
    theme?: string
    customTheme?: Record<string, string>
    themeOverrides?: Record<string, string>
    font?: string
    fontSize?: string
    fontWeight?: string
    lineHeight?: string
    letterSpacing?: string
    gravatar?: boolean
    format?: "html" | "txt" | "json"
    basePath?: string
    urlMode?: "subpath" | "subdomain"
    year?: number
    yearRange?: { start?: number, end?: number }
}

interface PackageJson {
    name?: string
    lixent?: PackageJsonLixent
}

/**
 * Validates a config object against security constraints.
 * Throws on invalid values, warns on non-critical issues (unknown theme, missing custom text).
 */
function validateConfig(config: LixentConfig): void {
    if (config.license === "custom") {
        const hasText = config.customLicense?.text != null && config.customLicense.text.length > 0
        const hasFile = config.licenseFile != null && config.licenseFile.length > 0
        if (!hasText && !hasFile) {
            throw new Error(
                '[lixent] License is "custom" but neither customLicense.text nor licenseFile is set.',
            )
        }
    }

    assertValidCopyright(config.copyright)
    if (config.url != null) assertValidUrl(config.url)
    if (config.email != null) assertValidEmail(config.email)
    if (config.theme === "custom") {
        if (config.customTheme == null) {
            throw new Error('[lixent] Theme is "custom" but customTheme is not set.')
        }
        assertValidCustomTheme(config.customTheme)
    } else if (!isValidTheme(config.theme) && !config.theme.startsWith("/")) {
        console.warn(
            `[lixent] Warning: Unknown built-in theme "${config.theme}". `
          + `For custom themes use an absolute path starting with "/" (e.g. "/my-theme.css"). `
          + `The page will attempt to load the CSS from the configured path.`,
        )
    }
    if (config.font != null) assertValidFont(config.font)
    if (config.fontSize != null) assertValidCssValue(config.fontSize, "fontSize")
    if (config.fontWeight != null) assertValidCssValue(config.fontWeight, "fontWeight")
    if (config.lineHeight != null) assertValidCssValue(config.lineHeight, "lineHeight")
    if (config.letterSpacing != null) assertValidCssValue(config.letterSpacing, "letterSpacing")
    if (config.year != null) assertValidYear(config.year)
    if (config.yearRange != null) {
        assertValidYear(config.yearRange.start)
        assertValidYear(config.yearRange.end)
        if (config.yearRange.start > config.yearRange.end) {
            throw new Error(
                `[lixent] yearRange.start (${config.yearRange.start}) must not exceed `
              + `yearRange.end (${config.yearRange.end})`,
            )
        }
    }
    if (config.year != null && config.yearRange != null) {
        throw new Error("[lixent] Both `year` and `yearRange` are set. Use only one.")
    }
    if (config.customLicense?.name != null) assertValidCustomName(config.customLicense.name)
    if (config.customLicense?.text != null) assertValidCustomText(config.customLicense.text)
    if (config.themeOverrides != null) {
        assertValidThemeOverrides(config.themeOverrides, THEME_VARIABLES)
    }
}

/**
 * Coerce a raw parsed JSON value into a LixentConfig shape.
 *
 * Handles common mistakes like `"year": "2024"` (string instead of number)
 * or `yearRange: { start: "2020", end: "2026" }` (strings instead of numbers).
 */
function coerceConfig(raw: Record<string, unknown>): LixentConfig {
    const config = { ...raw } as unknown as LixentConfig
    if (typeof raw.year === "string") {
        const n = Number(raw.year)
        if (!Number.isFinite(n)) {
            throw new Error(`[lixent] year must be a number, got "${raw.year}"`)
        }
        config.year = n
    }
    if (raw.yearRange != null && typeof raw.yearRange === "object") {
        const yr = raw.yearRange as Record<string, unknown>
        if (typeof yr.start === "string") {
            const n = Number(yr.start)
            if (!Number.isFinite(n)) {
                throw new Error(`[lixent] yearRange.start must be a number, got "${yr.start}"`)
            }
            ;(config.yearRange as Record<string, unknown>).start = n
        }
        if (typeof yr.end === "string") {
            const n = Number(yr.end)
            if (!Number.isFinite(n)) {
                throw new Error(`[lixent] yearRange.end must be a number, got "${yr.end}"`)
            }
            ;(config.yearRange as Record<string, unknown>).end = n
        }
    }
    return config
}

/**
 * Attempts to load config from the `"lixent"` field in `package.json`.
 * Returns `null` if no `package.json` exists or it has no `lixent` field.
 */
function loadFromPackageJson(root: string): LixentConfig | null {
    const pkgPath = resolve(root, "package.json")
    if (!existsSync(pkgPath)) return null

    const raw = readFileSync(pkgPath, "utf-8")
    const pkg = JSON.parse(raw) as PackageJson
    if (pkg.lixent == null) return null

    const lixentRaw = pkg.lixent as Record<string, unknown>
    if (lixentRaw.copyright == null || lixentRaw.copyright === "") {
        lixentRaw.copyright = pkg.name ?? ""
    }
    lixentRaw.license ??= "MIT"
    lixentRaw.theme ??= "minimal"

    const coerced = coerceConfig(lixentRaw)
    validateConfig(coerced)
    return coerced
}

/**
 * Load and validate the Lixent configuration.
 *
 * Tries `lixent.config.json` first, then `package.json`, then returns defaults.
 * All loaded configs are validated before being returned.
 *
 * @param root - Project root directory. Defaults to `process.cwd()`.
 * @returns A fully resolved, validated {@link LixentConfig}.
 * @throws {SyntaxError} If the config file contains invalid JSON.
 * @throws {Error} If any validation check fails.
 */
export function loadConfig(root: string = process.cwd()): LixentConfig {
    const configPath = resolve(root, CONFIG_FILE)

    if (existsSync(configPath)) {
        const raw = readFileSync(configPath, "utf-8")
        const parsed = JSON.parse(raw) as Record<string, unknown>
        const config = coerceConfig(parsed)
        validateConfig(config)
        return config
    }

    const fromPkg = loadFromPackageJson(root)
    if (fromPkg != null) return fromPkg

    return {
        copyright: "Unknown",
        license: "MIT",
        theme: "minimal",
    }
}
