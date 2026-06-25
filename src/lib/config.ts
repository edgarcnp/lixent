import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import type { LixentConfig } from "./types.ts"
import { isValidLicense } from "../licenses/index.ts"

const CONFIG_FILE = "lixent.config.json"

interface PackageJsonLixent {
    copyright?: string
    url?: string
    email?: string
    license?: string
    theme?: string
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
    if (config.license !== "custom") {
        if (!isValidLicense(config.license)) {
            console.warn(
                `[lixent] Warning: Unknown license "${config.license}". `
          + `Use "custom" with customLicense.text for custom licenses.`,
            )
        }
    } else if (!config.customLicense?.text) {
        console.warn(
            '[lixent] Warning: License is "custom" but customLicense.text is not set.',
        )
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
