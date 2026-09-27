/**
 * License resolution.
 *
 * Custom licenses come from the config or a file; SPDX licenses are fetched
 * from the SPDX license list on GitHub at build time. All network and file
 * access is injected, so the resolution logic is fully testable offline.
 *
 * @module
 */

import { readFileSync } from "node:fs"
import { resolve as resolvePath } from "node:path"
import { LicenseError } from "../diagnostics.ts"
import type { LixentConfig } from "../config/types.ts"
import { isValidLicenseId } from "./id.ts"

/** A resolved license: display name plus unrendered text. */
export interface ResolvedLicense {
    name: string
    text: string
}

/** Minimal fetch signature so tests can inject a fake. */
export type FetchLike = (input: string, init?: { signal?: AbortSignal }) => Promise<Response>

const DEFAULT_LIST_URL = "https://raw.githubusercontent.com/spdx/license-list-data/main/json/licenses.json"
const DEFAULT_TEXT_URL_BASE = "https://raw.githubusercontent.com/spdx/license-list-data/main/text/"
const FETCH_TIMEOUT_MS = 15_000
const CUSTOM_LICENSE_FALLBACK_NAME = "Custom License"

interface SpdxLicenseEntry {
    licenseId: string
    name: string
}

interface SpdxLicenseList {
    licenses?: SpdxLicenseEntry[]
}

/** Fetches SPDX names and texts, memoizing the list within one client. */
export interface SpdxClient {
    /** Display name for an id. Throws `NOT_FOUND` when the list has no such id. */
    nameFor(id: string): Promise<string>
    /** Raw license text for an id. */
    textFor(id: string): Promise<string>
}

/** Creates an SPDX client. Inject `fetchImpl` in tests; the list is fetched at most once. */
export function createSpdxClient(options: {
    fetchImpl?: FetchLike
    listUrl?: string
    textUrlBase?: string
} = {}): SpdxClient {
    const fetchImpl: FetchLike = options.fetchImpl ?? fetch
    const listUrl = options.listUrl ?? DEFAULT_LIST_URL
    const textUrlBase = options.textUrlBase ?? DEFAULT_TEXT_URL_BASE
    let listPromise: Promise<Map<string, string>> | undefined

    function loadList(): Promise<Map<string, string>> {
        listPromise ??= fetchImpl(listUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }).then(async (response) => {
            if (!response.ok) {
                throw new LicenseError(`Failed to fetch the SPDX license list: ${response.statusText}`, {
                    code: "FETCH_FAILED",
                })
            }
            const data = (await response.json()) as SpdxLicenseList
            const names = new Map<string, string>()
            for (const entry of data.licenses ?? []) {
                names.set(entry.licenseId, entry.name)
            }
            return names
        })
        return listPromise
    }

    return {
        async nameFor(id: string): Promise<string> {
            const names = await loadList()
            const name = names.get(id)
            if (name === undefined) {
                throw new LicenseError(`Unknown license "${id}". Check your lixent.config.json.`, {
                    code: "NOT_FOUND",
                    licenseId: id,
                })
            }
            return name
        },
        async textFor(id: string): Promise<string> {
            const response = await fetchImpl(`${textUrlBase}${id}.txt`, {
                signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            })
            if (response.status === 404) {
                throw new LicenseError(`Unknown license "${id}". Check your lixent.config.json.`, {
                    code: "NOT_FOUND",
                    licenseId: id,
                })
            }
            if (!response.ok) {
                throw new LicenseError(`Failed to fetch license "${id}": ${response.statusText}`, {
                    code: "FETCH_FAILED",
                    licenseId: id,
                })
            }
            return response.text()
        },
    }
}

export interface ResolveLicenseOptions {
    /** Root used to resolve `licenseFile`. Defaults to `process.cwd()`. */
    root?: string
    /** Injectable file reader for tests. */
    readFile?: (path: string) => string
    /** Injectable SPDX client; one is created per call when omitted. */
    spdx?: SpdxClient
}

/**
 * Resolves the configured license to a display name and raw text.
 *
 * @throws {LicenseError} If the license id is invalid, the license cannot be
 * fetched, or custom license text is missing or unreadable.
 */
export async function resolveLicense(
    config: LixentConfig,
    options: ResolveLicenseOptions = {},
): Promise<ResolvedLicense> {
    if (config.license === "custom") {
        return resolveCustomLicense(config, options)
    }

    const id = config.license
    if (!isValidLicenseId(id)) {
        throw new LicenseError(`Invalid license id "${id}"`, { code: "INVALID_ID", licenseId: id })
    }
    const spdx = options.spdx ?? createSpdxClient()
    const name = await spdx.nameFor(id)
    const text = await spdx.textFor(id)
    return { name, text }
}

function resolveCustomLicense(config: LixentConfig, options: ResolveLicenseOptions): ResolvedLicense {
    const name = config.customLicense?.name ?? CUSTOM_LICENSE_FALLBACK_NAME
    const file = config.licenseFile

    if (file !== undefined) {
        const readFile = options.readFile ?? readFileUtf8
        const path = resolvePath(options.root ?? process.cwd(), file)
        try {
            return { name, text: readFile(path) }
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error)
            throw new LicenseError(`Failed to read license file "${file}": ${reason}`, { code: "FILE_UNREADABLE" })
        }
    }

    const text = config.customLicense?.text
    if (text === undefined || text.length === 0) {
        throw new LicenseError(
            'License is "custom" but no license text was found. Set customLicense.text or licenseFile.',
            { code: "MISSING_TEXT" },
        )
    }
    return { name, text }
}

function readFileUtf8(path: string): string {
    return readFileSync(path, "utf-8")
}
