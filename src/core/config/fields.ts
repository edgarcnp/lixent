/**
 * Configuration parsing and validation.
 *
 * Every accepted key is declared once and parsed into a typed value. Parsing
 * collects all problems instead of stopping at the first one, and unknown keys
 * are rejected so typos cannot be silently ignored.
 *
 * @module
 */

import { diagnostic, type ConfigErrorCode, type Diagnostic } from "../diagnostics.ts"
import { hasCssDangerous, hasHtmlTags } from "../sanitize.ts"
import { DEFAULT_THEME_PRESET, isBuiltInTheme, THEME_COLOR_KEYS } from "../theme/catalog.ts"
import { isValidLicenseId } from "../license/id.ts"
import type { CustomLicenseConfig, LixentConfig, ThemeColors, ThemeConfig } from "./types.ts"

/** Top-level keys the configuration accepts. `$schema` is ignored. */
export const CONFIG_KEYS = [
    "$schema",
    "copyright",
    "url",
    "email",
    "gravatar",
    "license",
    "customLicense",
    "licenseFile",
    "year",
    "yearRange",
    "basePath",
    "theme",
] as const

/** Keys accepted inside `theme`. */
export const THEME_KEYS = [
    "preset",
    "colors",
    "font",
    "fontSize",
    "fontWeight",
    "lineHeight",
    "letterSpacing",
] as const

/** Result of parsing one value: either a typed value or collected problems. */
export type ParseResult<T>
    = | { ok: true, value: T }
    | { ok: false, diagnostics: Diagnostic[] }

/** `theme` keys that hold a single CSS value. */
type MetricKey = "fontSize" | "fontWeight" | "lineHeight" | "letterSpacing"

const MAX_COPYRIGHT_LENGTH = 256
const MAX_CUSTOM_NAME_LENGTH = 256
const MAX_CUSTOM_TEXT_LENGTH = 50 * 1024
const MAX_CSS_VALUE_LENGTH = 64
const MAX_FONT_LENGTH = 128
const MAX_URL_LENGTH = 2048
const MAX_LICENSE_LENGTH = 128
const MAX_LICENSE_FILE_LENGTH = 256
const MAX_BASE_PATH_LENGTH = 256
const MIN_YEAR = 1900
const MAX_YEAR = 2100

const EMAIL_PATTERN = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/
const FONT_PATTERN = /^[A-Za-z0-9 -]+$/
const CSS_VALUE_PATTERN = /^[a-zA-Z0-9 .%,+()/-]+$/
const COLOR_VALUE_PATTERN = /^[#a-zA-Z0-9 .%,+()/-]+$/

/** True when `raw` is a JSON object rather than an array or primitive. */
export function isPlainObject(raw: unknown): raw is Record<string, unknown> {
    return typeof raw === "object" && raw !== null && !Array.isArray(raw)
}

/**
 * Parses and validates a raw configuration object.
 *
 * Never throws: every problem is returned as a diagnostic so callers can
 * report all of them at once.
 */
export function parseConfig(raw: Record<string, unknown>): ParseResult<LixentConfig> {
    const diagnostics: Diagnostic[] = []
    diagnostics.push(...unknownKeyDiagnostics(raw, CONFIG_KEYS, ""))

    const copyright = parseString("copyright", raw.copyright, {
        required: true,
        maxLength: MAX_COPYRIGHT_LENGTH,
        forbidHtml: true,
    })
    const license = parseString("license", raw.license, { required: true, maxLength: MAX_LICENSE_LENGTH })
    const url = parseString("url", raw.url, { maxLength: MAX_URL_LENGTH })
    const email = parseString("email", raw.email, {
        maxLength: 320,
        pattern: EMAIL_PATTERN,
        patternMessage: "email has an invalid format",
    })
    const gravatar = parseBoolean("gravatar", raw.gravatar)
    const customLicense = parseCustomLicense(raw.customLicense)
    const licenseFile = parseString("licenseFile", raw.licenseFile, { maxLength: MAX_LICENSE_FILE_LENGTH })
    const basePath = parseString("basePath", raw.basePath, { maxLength: MAX_BASE_PATH_LENGTH })
    const theme = parseTheme(raw.theme)

    let year: number | undefined
    if (raw.year !== undefined) {
        const result = parseYear("year", raw.year)
        if (result.ok) {
            year = result.value
        } else {
            diagnostics.push(...result.diagnostics)
        }
    }

    let yearRange: { start: number, end: number } | undefined
    if (raw.yearRange !== undefined) {
        const result = parseYearRange("yearRange", raw.yearRange)
        if (result.ok) {
            yearRange = result.value
        } else {
            diagnostics.push(...result.diagnostics)
        }
    }

    for (const result of [copyright, license, url, email, gravatar, customLicense, licenseFile, basePath, theme]) {
        if (!result.ok) {
            diagnostics.push(...result.diagnostics)
        }
    }

    if (license.ok && license.value !== undefined && license.value !== "custom" && !isValidLicenseId(license.value)) {
        diagnostics.push(diagnostic("INVALID_VALUE", "license", `License must be an SPDX id or "custom", got "${license.value}"`))
    }

    if (url.ok && url.value !== undefined) {
        const reason = urlProblem(url.value)
        if (reason !== undefined) {
            diagnostics.push(diagnostic(reason.code, "url", reason.message))
        }
    }

    if (licenseFile.ok && licenseFile.value !== undefined && !isSafeRelativePath(licenseFile.value)) {
        diagnostics.push(diagnostic(
            "INVALID_FORMAT",
            "licenseFile",
            "licenseFile must be a relative path inside the project (no absolute paths or \"..\" segments)",
        ))
    }

    if (basePath.ok && basePath.value !== undefined && !isValidBasePath(basePath.value)) {
        diagnostics.push(diagnostic(
            "INVALID_FORMAT",
            "basePath",
            'basePath must start with "/" and must not end with "/" (e.g. "/license")',
        ))
    }

    const requiredCopyright = copyright.ok ? copyright.value : undefined
    const requiredLicense = license.ok ? license.value : undefined
    if (requiredCopyright === undefined || requiredLicense === undefined) {
        return { ok: false, diagnostics }
    }

    const config: LixentConfig = {
        copyright: requiredCopyright,
        license: requiredLicense,
        gravatar: gravatar.ok ? gravatar.value ?? false : false,
        theme: theme.ok ? theme.value : { preset: DEFAULT_THEME_PRESET },
        url: url.ok ? url.value : undefined,
        email: email.ok ? email.value : undefined,
        customLicense: customLicense.ok ? customLicense.value : undefined,
        licenseFile: licenseFile.ok ? licenseFile.value : undefined,
        year,
        yearRange,
        basePath: basePath.ok ? basePath.value : undefined,
    }

    if (diagnostics.length === 0) {
        diagnostics.push(...crossFieldDiagnostics(config))
    }

    if (diagnostics.length > 0) {
        return { ok: false, diagnostics }
    }
    return { ok: true, value: config }
}

function crossFieldDiagnostics(config: LixentConfig): Diagnostic[] {
    const diagnostics: Diagnostic[] = []

    if (config.license === "custom") {
        const hasInline = config.customLicense?.text !== undefined
        const hasFile = config.licenseFile !== undefined
        if (hasInline && hasFile) {
            diagnostics.push(diagnostic(
                "MUTUALLY_EXCLUSIVE",
                "licenseFile",
                "Set either customLicense.text or licenseFile, not both",
            ))
        }
        if (!hasInline && !hasFile) {
            diagnostics.push(diagnostic(
                "MISSING_FIELD",
                "license",
                'License is "custom" but neither customLicense.text nor licenseFile is set',
            ))
        }
    } else {
        if (config.customLicense !== undefined) {
            diagnostics.push(diagnostic("INVALID_VALUE", "customLicense", 'customLicense is only used when license is "custom"'))
        }
        if (config.licenseFile !== undefined) {
            diagnostics.push(diagnostic("INVALID_VALUE", "licenseFile", 'licenseFile is only used when license is "custom"'))
        }
    }

    if (config.year !== undefined && config.yearRange !== undefined) {
        diagnostics.push(diagnostic("MUTUALLY_EXCLUSIVE", "year", "Set either year or yearRange, not both"))
    }
    if (config.yearRange !== undefined && config.yearRange.start > config.yearRange.end) {
        diagnostics.push(diagnostic(
            "INVALID_VALUE",
            "yearRange",
            `yearRange.start (${config.yearRange.start}) must not exceed yearRange.end (${config.yearRange.end})`,
        ))
    }
    if (config.gravatar && config.email === undefined) {
        diagnostics.push(diagnostic("INVALID_VALUE", "gravatar", "gravatar requires email to be set"))
    }

    return diagnostics
}

interface StringOptions {
    required?: boolean
    maxLength?: number
    trim?: boolean
    pattern?: RegExp
    patternMessage?: string
    forbidHtml?: boolean
    forbidCssDangerous?: boolean
}

function parseString(key: string, raw: unknown, options: StringOptions = {}): ParseResult<string | undefined> {
    if (raw === undefined || raw === null) {
        return options.required === true
            ? failure(diagnostic("MISSING_FIELD", key, `${key} is required`))
            : { ok: true, value: undefined }
    }
    if (typeof raw !== "string") {
        return failure(diagnostic("INVALID_TYPE", key, `${key} must be a string`))
    }
    const value = options.trim === false ? raw : raw.trim()
    if (value.length === 0) {
        return options.required === true
            ? failure(diagnostic("EMPTY_FIELD", key, `${key} cannot be empty`))
            : { ok: true, value: undefined }
    }
    if (options.maxLength !== undefined && value.length > options.maxLength) {
        return failure(diagnostic("TOO_LONG", key, `${key} exceeds ${options.maxLength} characters`))
    }
    if (options.forbidHtml === true && hasHtmlTags(value)) {
        return failure(diagnostic("HTML_TAGS", key, `${key} contains HTML tags`))
    }
    if (options.forbidCssDangerous === true && hasCssDangerous(value)) {
        return failure(diagnostic("UNSAFE_VALUE", key, `${key} contains unsafe CSS characters`))
    }
    if (options.pattern !== undefined && !options.pattern.test(value)) {
        return failure(diagnostic("INVALID_FORMAT", key, options.patternMessage ?? `${key} has an invalid format`))
    }
    return { ok: true, value }
}

function parseBoolean(key: string, raw: unknown): ParseResult<boolean | undefined> {
    if (raw === undefined || raw === null) {
        return { ok: true, value: undefined }
    }
    if (typeof raw !== "boolean") {
        return failure(diagnostic("INVALID_TYPE", key, `${key} must be a boolean`))
    }
    return { ok: true, value: raw }
}

function parseYear(key: string, raw: unknown): ParseResult<number> {
    if (raw === undefined || raw === null) {
        return failure(diagnostic("MISSING_FIELD", key, `${key} is required`))
    }
    let value: number
    if (typeof raw === "number") {
        value = raw
    } else if (typeof raw === "string" && raw.trim().length > 0) {
        value = Number(raw)
        if (!Number.isFinite(value)) {
            return failure(diagnostic("INVALID_TYPE", key, `${key} must be a number, got "${raw}"`))
        }
    } else {
        return failure(diagnostic("INVALID_TYPE", key, `${key} must be a number`))
    }
    if (!Number.isInteger(value)) {
        return failure(diagnostic("INVALID_TYPE", key, `${key} must be an integer`))
    }
    if (value < MIN_YEAR || value > MAX_YEAR) {
        return failure(diagnostic("OUT_OF_RANGE", key, `${key} must be between ${MIN_YEAR} and ${MAX_YEAR}`))
    }
    return { ok: true, value }
}

function parseYearRange(key: string, raw: unknown): ParseResult<{ start: number, end: number }> {
    if (!isPlainObject(raw)) {
        return failure(diagnostic("INVALID_TYPE", key, `${key} must be an object with "start" and "end"`))
    }
    const diagnostics: Diagnostic[] = unknownKeyDiagnostics(raw, ["start", "end"], key)
    const start = parseYear(`${key}.start`, raw.start)
    const end = parseYear(`${key}.end`, raw.end)
    if (!start.ok) {
        diagnostics.push(...start.diagnostics)
    }
    if (!end.ok) {
        diagnostics.push(...end.diagnostics)
    }
    if (diagnostics.length > 0) {
        return { ok: false, diagnostics }
    }
    if (!start.ok || !end.ok) {
        return failure(diagnostic("INVALID_TYPE", key, `${key} is invalid`))
    }
    return { ok: true, value: { start: start.value, end: end.value } }
}

function parseCustomLicense(raw: unknown): ParseResult<CustomLicenseConfig | undefined> {
    if (raw === undefined || raw === null) {
        return { ok: true, value: undefined }
    }
    if (!isPlainObject(raw)) {
        return failure(diagnostic("INVALID_TYPE", "customLicense", "customLicense must be an object"))
    }
    const diagnostics: Diagnostic[] = unknownKeyDiagnostics(raw, ["name", "text"], "customLicense")
    const name = parseString("customLicense.name", raw.name, {
        maxLength: MAX_CUSTOM_NAME_LENGTH,
        forbidHtml: true,
    })
    const text = parseString("customLicense.text", raw.text, {
        maxLength: MAX_CUSTOM_TEXT_LENGTH,
        trim: false,
    })
    if (!name.ok) {
        diagnostics.push(...name.diagnostics)
    }
    if (!text.ok) {
        diagnostics.push(...text.diagnostics)
    }
    if (diagnostics.length > 0) {
        return { ok: false, diagnostics }
    }
    const value: CustomLicenseConfig = {}
    if (name.ok && name.value !== undefined) {
        value.name = name.value
    }
    if (text.ok && text.value !== undefined) {
        value.text = text.value
    }
    return { ok: true, value }
}

function parseTheme(raw: unknown): ParseResult<ThemeConfig> {
    if (raw === undefined || raw === null) {
        return { ok: true, value: { preset: DEFAULT_THEME_PRESET } }
    }
    if (!isPlainObject(raw)) {
        return failure(diagnostic("INVALID_TYPE", "theme", "theme must be an object"))
    }
    const diagnostics: Diagnostic[] = unknownKeyDiagnostics(raw, THEME_KEYS, "theme")

    const preset = parseString("theme.preset", raw.preset, { maxLength: 256 })
    if (preset.ok && preset.value !== undefined && !isBuiltInTheme(preset.value) && !preset.value.startsWith("/")) {
        diagnostics.push(diagnostic(
            "INVALID_VALUE",
            "theme.preset",
            `Unknown theme "${preset.value}". Use a built-in theme id or a path starting with "/"`,
        ))
    }
    if (!preset.ok) {
        diagnostics.push(...preset.diagnostics)
    }

    const font = parseString("theme.font", raw.font, {
        maxLength: MAX_FONT_LENGTH,
        pattern: FONT_PATTERN,
        patternMessage: "theme.font may only contain letters, numbers, spaces, and hyphens",
        forbidCssDangerous: true,
    })
    if (!font.ok) {
        diagnostics.push(...font.diagnostics)
    }

    const colors = parseColors(raw.colors)
    if (!colors.ok) {
        diagnostics.push(...colors.diagnostics)
    }

    const metrics: [MetricKey, ParseResult<string | undefined>][] = [
        ["fontSize", parseString("theme.fontSize", raw.fontSize, cssValueOptions("fontSize"))],
        ["fontWeight", parseString("theme.fontWeight", raw.fontWeight, cssValueOptions("fontWeight"))],
        ["lineHeight", parseString("theme.lineHeight", raw.lineHeight, cssValueOptions("lineHeight"))],
        ["letterSpacing", parseString("theme.letterSpacing", raw.letterSpacing, cssValueOptions("letterSpacing"))],
    ]
    for (const [, result] of metrics) {
        if (!result.ok) {
            diagnostics.push(...result.diagnostics)
        }
    }

    if (diagnostics.length > 0) {
        return { ok: false, diagnostics }
    }

    const value: ThemeConfig = {
        preset: preset.ok ? preset.value ?? DEFAULT_THEME_PRESET : DEFAULT_THEME_PRESET,
    }
    if (font.ok && font.value !== undefined) {
        value.font = font.value
    }
    if (colors.ok && colors.value !== undefined) {
        value.colors = colors.value
    }
    for (const [key, result] of metrics) {
        if (result.ok && result.value !== undefined) {
            value[key] = result.value
        }
    }
    return { ok: true, value }
}

function cssValueOptions(field: string): StringOptions {
    return {
        maxLength: MAX_CSS_VALUE_LENGTH,
        pattern: CSS_VALUE_PATTERN,
        patternMessage: `theme.${field} contains invalid characters`,
        forbidCssDangerous: true,
    }
}

function parseColors(raw: unknown): ParseResult<ThemeColors | undefined> {
    if (raw === undefined || raw === null) {
        return { ok: true, value: undefined }
    }
    if (!isPlainObject(raw)) {
        return failure(diagnostic("INVALID_TYPE", "theme.colors", "theme.colors must be an object"))
    }
    const diagnostics: Diagnostic[] = unknownKeyDiagnostics(raw, THEME_COLOR_KEYS, "theme.colors")
    const value: ThemeColors = {}
    for (const colorKey of THEME_COLOR_KEYS) {
        const result = parseString(`theme.colors.${colorKey}`, raw[colorKey], {
            maxLength: MAX_CSS_VALUE_LENGTH,
            pattern: COLOR_VALUE_PATTERN,
            patternMessage: `theme.colors.${colorKey} contains invalid characters`,
            forbidCssDangerous: true,
        })
        if (!result.ok) {
            diagnostics.push(...result.diagnostics)
        } else if (result.value !== undefined) {
            value[colorKey] = result.value
        }
    }
    if (diagnostics.length > 0) {
        return { ok: false, diagnostics }
    }
    return { ok: true, value }
}

function unknownKeyDiagnostics(
    object: Record<string, unknown>,
    allowed: readonly string[],
    prefix: string,
): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    for (const key of Object.keys(object)) {
        if (!allowed.includes(key)) {
            const field = prefix.length === 0 ? key : `${prefix}.${key}`
            diagnostics.push(diagnostic("UNKNOWN_KEY", field, `Unknown configuration key "${field}"`))
        }
    }
    return diagnostics
}

function urlProblem(value: string): { code: ConfigErrorCode, message: string } | undefined {
    let parsed: URL
    try {
        parsed = new URL(value)
    } catch {
        return { code: "INVALID_FORMAT", message: `Invalid URL "${value}"` }
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { code: "INVALID_PROTOCOL", message: `URL must use http: or https:, got ${parsed.protocol}` }
    }
    return undefined
}

function isSafeRelativePath(value: string): boolean {
    if (value.startsWith("/")) return false
    if (/^[A-Za-z]:/.test(value)) return false
    const segments = value.split(/[\\/]/)
    return !segments.includes("..") && !segments.includes("")
}

function isValidBasePath(value: string): boolean {
    if (!value.startsWith("/")) return false
    if (value.startsWith("//")) return false
    return value.length === 1 || !value.endsWith("/")
}

function failure(...diagnostics: Diagnostic[]): { ok: false, diagnostics: Diagnostic[] } {
    return { ok: false, diagnostics }
}
