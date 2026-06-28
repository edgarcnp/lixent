/**
 * Config loading.
 *
 * Reads `lixent.config.json` (preferred) or the `"lixent"` field in
 * `package.json`, applies defaults, coerces types, and runs validation.
 *
 * ## Config priority
 * 1. `lixent.config.json` in the project root
 * 2. `"lixent"` field in `package.json`
 * 3. Hardcoded defaults (`copyright: "Unknown"`, `license: "MIT"`, `theme: "minimal"`)
 *
 * @module
 */

import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import type { LixentConfig } from "../types.ts"
import { ConfigError } from "../errors.ts"
import { coerceConfig } from "./coercion.ts"
import { validateConfig } from "./validator.ts"

const CONFIG_FILE = "lixent.config.json"

interface PackageJson {
    name?: string
    lixent?: Partial<LixentConfig>
}

/**
 * Attempts to load config from the `"lixent"` field in `package.json`.
 * Returns `null` if no `package.json` exists or it has no `lixent` field.
 *
 * @throws {ConfigError} If copyright is missing and cannot be inferred from `package.json` name.
 */
function loadFromPackageJson(root: string): LixentConfig | null {
    const pkgPath = resolve(root, "package.json")
    if (!existsSync(pkgPath)) return null

    const raw = readFileSync(pkgPath, "utf-8")
    const pkg = JSON.parse(raw) as PackageJson
    if (pkg.lixent == null) return null

    const lixent = pkg.lixent as Record<string, unknown>
    const copyright = lixent.copyright ?? pkg.name
    if (copyright == null || copyright === "") {
        throw new ConfigError(
            '[lixent] copyright is required. Set it in lixent field or provide a "name" field in package.json.',
        )
    }

    const merged = {
        ...lixent,
        copyright,
        license: lixent.license ?? "MIT",
        theme: lixent.theme ?? "minimal",
    }

    const coerced = coerceConfig(merged)
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
 * @throws {ConfigError} If any validation check fails.
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
