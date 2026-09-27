/**
 * Configuration loading.
 *
 * Reads `lixent.config.json` from the project root, parses it, and validates
 * it. This is the only module that touches the filesystem for configuration.
 *
 * @module
 */

import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { ConfigError, diagnostic } from "../diagnostics.ts"
import { isPlainObject, parseConfig } from "./fields.ts"
import type { LixentConfig } from "./types.ts"

/** Name of the configuration file loaded from the project root. */
export const CONFIG_FILE_NAME = "lixent.config.json"

export interface LoadConfigOptions {
    /** Project root used to resolve the config file. Defaults to `process.cwd()`. */
    root?: string
    /** Explicit config file path. Wins over `root`. */
    configPath?: string
}

/**
 * Reads, parses, and validates the configuration.
 *
 * @throws {ConfigError} Carrying every diagnostic when the file is missing,
 * unreadable, malformed, or invalid.
 */
export function loadConfig(options: LoadConfigOptions = {}): LixentConfig {
    const root = options.root ?? process.cwd()
    const configPath = options.configPath ?? resolve(root, CONFIG_FILE_NAME)

    if (!existsSync(configPath)) {
        throw new ConfigError([
            diagnostic("CONFIG_MISSING", "config", `No ${CONFIG_FILE_NAME} found at ${configPath}`),
        ])
    }

    let raw: unknown
    try {
        raw = JSON.parse(readFileSync(configPath, "utf-8"))
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        throw new ConfigError([
            diagnostic("CONFIG_PARSE", "config", `Failed to read or parse ${configPath}: ${reason}`),
        ])
    }

    if (!isPlainObject(raw)) {
        throw new ConfigError([
            diagnostic("CONFIG_SHAPE", "config", `${configPath} must contain a JSON object`),
        ])
    }

    const result = parseConfig(raw)
    if (!result.ok) {
        throw new ConfigError(result.diagnostics)
    }
    return result.value
}
