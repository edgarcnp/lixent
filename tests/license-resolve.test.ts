import { afterEach, beforeEach, describe, it } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { LicenseError, type LicenseErrorCode } from "../src/core/diagnostics.ts"
import { createSpdxClient, resolveLicense, type FetchLike, type SpdxClient } from "../src/core/license/resolve.ts"
import type { LixentConfig } from "../src/core/config/types.ts"

const TMP_DIR = join(import.meta.dirname, "../tmp-license-test")
const LIST_URL = "https://example.test/licenses.json"
const TEXT_URL_BASE = "https://example.test/text/"

function customConfig(overrides: Partial<LixentConfig> = {}): LixentConfig {
    return {
        copyright: "Jane Doe",
        license: "custom",
        gravatar: false,
        theme: { preset: "minimal" },
        ...overrides,
    }
}

function spdxConfig(id: string): LixentConfig {
    return {
        copyright: "Jane Doe",
        license: id,
        gravatar: false,
        theme: { preset: "minimal" },
    }
}

function createFakeFetch(routes: Map<string, { status: number, body: string }>): { fetchImpl: FetchLike, calls: string[] } {
    const calls: string[] = []
    const fetchImpl: FetchLike = (input) => {
        calls.push(input)
        const route = routes.get(input)
        return Promise.resolve(new Response(route?.body ?? "not found", { status: route?.status ?? 404 }))
    }
    return { fetchImpl, calls }
}

function spdxRoutes(): Map<string, { status: number, body: string }> {
    return new Map([
        [LIST_URL, { status: 200, body: JSON.stringify({ licenses: [{ licenseId: "MIT", name: "MIT License" }] }) }],
        [`${TEXT_URL_BASE}MIT.txt`, { status: 200, body: "MIT license text" }],
    ])
}

async function expectLicenseError(promise: Promise<unknown>, code: LicenseErrorCode): Promise<LicenseError> {
    let captured: LicenseError | undefined
    await assert.rejects(promise, (error: unknown) => {
        assert.ok(error instanceof LicenseError, `expected LicenseError, got ${String(error)}`)
        captured = error
        return true
    })
    assert.ok(captured !== undefined)
    assert.equal(captured.code, code)
    return captured
}

beforeEach(() => {
    mkdirSync(TMP_DIR, { recursive: true })
})

afterEach(() => {
    if (existsSync(TMP_DIR)) {
        rmSync(TMP_DIR, { recursive: true })
    }
})

describe("resolveLicense custom licenses", () => {
    it("resolves inline custom text", async () => {
        const resolved = await resolveLicense(customConfig({ customLicense: { name: "Mine", text: "hello" } }))
        assert.deepEqual(resolved, { name: "Mine", text: "hello" })
    })

    it("falls back to a generic name", async () => {
        const resolved = await resolveLicense(customConfig({ customLicense: { text: "hello" } }))
        assert.equal(resolved.name, "Custom License")
    })

    it("reads licenseFile relative to the provided root", async () => {
        writeFileSync(join(TMP_DIR, "LICENSE-custom"), "file license text")
        const resolved = await resolveLicense(customConfig({ licenseFile: "LICENSE-custom" }), { root: TMP_DIR })
        assert.equal(resolved.text, "file license text")
    })

    it("throws MISSING_TEXT when custom text is absent", async () => {
        await expectLicenseError(resolveLicense(customConfig()), "MISSING_TEXT")
    })

    it("throws FILE_UNREADABLE when the file cannot be read", async () => {
        await expectLicenseError(
            resolveLicense(customConfig({ licenseFile: "missing.txt" }), { root: TMP_DIR }),
            "FILE_UNREADABLE",
        )
    })
})

describe("resolveLicense SPDX licenses", () => {
    it("resolves name and text through the injected client", async () => {
        const { fetchImpl } = createFakeFetch(spdxRoutes())
        const spdx = createSpdxClient({ fetchImpl, listUrl: LIST_URL, textUrlBase: TEXT_URL_BASE })
        const resolved = await resolveLicense(spdxConfig("MIT"), { spdx })
        assert.deepEqual(resolved, { name: "MIT License", text: "MIT license text" })
    })

    it("fetches the SPDX list at most once per client", async () => {
        const { fetchImpl, calls } = createFakeFetch(spdxRoutes())
        const spdx = createSpdxClient({ fetchImpl, listUrl: LIST_URL, textUrlBase: TEXT_URL_BASE })
        await resolveLicense(spdxConfig("MIT"), { spdx })
        await resolveLicense(spdxConfig("MIT"), { spdx })
        assert.equal(calls.filter((url) => url === LIST_URL).length, 1)
        assert.equal(calls.filter((url) => url === `${TEXT_URL_BASE}MIT.txt`).length, 2)
    })

    it("reports NOT_FOUND for an id missing from the SPDX list", async () => {
        const { fetchImpl, calls } = createFakeFetch(spdxRoutes())
        const spdx = createSpdxClient({ fetchImpl, listUrl: LIST_URL, textUrlBase: TEXT_URL_BASE })
        const error = await expectLicenseError(resolveLicense(spdxConfig("NOPE-1.0"), { spdx }), "NOT_FOUND")
        assert.equal(error.licenseId, "NOPE-1.0")
        assert.equal(calls.filter((url) => url.startsWith(TEXT_URL_BASE)).length, 0)
    })

    it("reports NOT_FOUND when the text is missing but the list knows the id", async () => {
        const routes = spdxRoutes()
        routes.delete(`${TEXT_URL_BASE}MIT.txt`)
        const { fetchImpl } = createFakeFetch(routes)
        const spdx = createSpdxClient({ fetchImpl, listUrl: LIST_URL, textUrlBase: TEXT_URL_BASE })
        await expectLicenseError(resolveLicense(spdxConfig("MIT"), { spdx }), "NOT_FOUND")
    })

    it("reports FETCH_FAILED when the list request fails", async () => {
        const routes = new Map([[LIST_URL, { status: 500, body: "boom" }]])
        const { fetchImpl } = createFakeFetch(routes)
        const spdx = createSpdxClient({ fetchImpl, listUrl: LIST_URL, textUrlBase: TEXT_URL_BASE })
        await expectLicenseError(resolveLicense(spdxConfig("MIT"), { spdx }), "FETCH_FAILED")
    })

    it("reports INVALID_ID before any network access", async () => {
        const unused: SpdxClient = {
            nameFor: () => Promise.reject(new Error("should not be called")),
            textFor: () => Promise.reject(new Error("should not be called")),
        }
        await expectLicenseError(resolveLicense(spdxConfig("bad id"), { spdx: unused }), "INVALID_ID")
    })
})
