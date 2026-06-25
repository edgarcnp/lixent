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
} from "./validation.ts"

const CONFIG_FILE = "lixent.config.json"

interface PackageJsonLixent {
    copyright?: string
    url?: string
    email?: string
    license?: string
    theme?: string
    font?: string
    fontSize?: string
    fontWeight?: string
    lineHeight?: string
    letterSpacing?: string
    gravatar?: boolean
    format?: "html" | "txt" | "json"
    basePath?: string
    urlMode?: "subpath" | "subdomain"
}

interface PackageJson {
    name?: string
    lixent?: PackageJsonLixent
}

function validateConfig(config: LixentConfig): void {
    if (config.license === "custom" && !config.customLicense?.text) {
        console.warn(
            '[lixent] Warning: License is "custom" but customLicense.text is not set.',
        )
    }

    assertValidCopyright(config.copyright)
    if (config.url != null) assertValidUrl(config.url)
    if (config.email != null) assertValidEmail(config.email)
    if (!isValidTheme(config.theme)) {
        console.warn(
            `[lixent] Warning: Unknown theme "${config.theme}". `
          + "Using default theme.",
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
    }
    if (config.customLicense?.name != null) assertValidCustomName(config.customLicense.name)
    if (config.customLicense?.text != null) assertValidCustomText(config.customLicense.text)
    if (config.themeOverrides != null) {
        assertValidThemeOverrides(config.themeOverrides, THEME_VARIABLES)
    }
}

function loadFromPackageJson(root: string): LixentConfig | null {
    const pkgPath = resolve(root, "package.json")
    if (!existsSync(pkgPath)) return null

    const raw = readFileSync(pkgPath, "utf-8")
    const pkg = JSON.parse(raw) as PackageJson
    if (pkg.lixent == null) return null

    const config: LixentConfig = {
        copyright: pkg.lixent.copyright ?? pkg.name ?? "",
        url: pkg.lixent.url,
        email: pkg.lixent.email,
        license: pkg.lixent.license ?? "MIT",
        theme: pkg.lixent.theme ?? "minimal",
        font: pkg.lixent.font,
        fontSize: pkg.lixent.fontSize,
        fontWeight: pkg.lixent.fontWeight,
        lineHeight: pkg.lixent.lineHeight,
        letterSpacing: pkg.lixent.letterSpacing,
        gravatar: pkg.lixent.gravatar,
        format: pkg.lixent.format,
        basePath: pkg.lixent.basePath,
        urlMode: pkg.lixent.urlMode,
    }

    validateConfig(config)
    return config
}

export function loadConfig(root: string = process.cwd()): LixentConfig {
    const configPath = resolve(root, CONFIG_FILE)

    if (existsSync(configPath)) {
        const raw = readFileSync(configPath, "utf-8")
        const config = JSON.parse(raw) as LixentConfig
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
