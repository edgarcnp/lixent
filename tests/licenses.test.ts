import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
    renderLicenseText,
    getLicenseName,
    SPDX_LIST_URL,
    SPDX_TEXT_BASE,
} from "../src/lib/license.ts"
import type { LixentConfig } from "../src/lib/types.ts"

const baseConfig: LixentConfig = {
    copyright: "Test User",
    license: "MIT",
    theme: "minimal",
}

const baseValues = { year: "2026", name: "Test User" }

describe("SPDX URLs", () => {
    it("points to raw GitHub content", () => {
        assert.ok(SPDX_LIST_URL.startsWith("https://raw.githubusercontent.com/"))
        assert.ok(SPDX_TEXT_BASE.startsWith("https://raw.githubusercontent.com/"))
    })
})

describe("renderLicenseText", () => {
    it("replaces year placeholder", () => {
        const result = renderLicenseText("Copyright (c) {{year}} {{name}}", baseValues)
        assert.ok(result.includes("2026"))
        assert.ok(result.includes("Test User"))
    })

    it("replaces name placeholder", () => {
        assert.equal(renderLicenseText("{{name}}", baseValues), "Test User")
    })

    it("replaces url placeholder", () => {
        assert.equal(renderLicenseText("{{url}}", { ...baseValues, url: "https://example.com" }), "https://example.com")
    })

    it("replaces email placeholder", () => {
        assert.equal(renderLicenseText("{{email}}", { ...baseValues, email: "test@example.com" }), "test@example.com")
    })

    it("handles missing optional fields", () => {
        assert.equal(renderLicenseText("{{url}} {{email}}", baseValues), " ")
    })
})

describe("getLicenseName", () => {
    it("returns license id for standard license", () => {
        assert.equal(getLicenseName(baseConfig), "MIT")
    })

    it("returns custom license name", () => {
        const config: LixentConfig = {
            ...baseConfig,
            license: "custom",
            customLicense: { name: "My License", text: "text" },
        }
        assert.equal(getLicenseName(config), "My License")
    })
})
