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

describe("SPDX URLs", () => {
    it("points to raw GitHub content", () => {
        assert.ok(SPDX_LIST_URL.startsWith("https://raw.githubusercontent.com/"))
        assert.ok(SPDX_TEXT_BASE.startsWith("https://raw.githubusercontent.com/"))
    })
})

describe("renderLicenseText", () => {
    it("replaces year placeholder", () => {
        const text = "Copyright (c) {{year}} {{name}}"
        const result = renderLicenseText(text, baseConfig)
        const currentYear = new Date().getFullYear()
        assert.ok(result.includes(String(currentYear)))
        assert.ok(result.includes("Test User"))
    })

    it("replaces name placeholder", () => {
        const result = renderLicenseText("{{name}}", baseConfig)
        assert.equal(result, "Test User")
    })

    it("replaces url placeholder", () => {
        const config = { ...baseConfig, url: "https://example.com" }
        const result = renderLicenseText("{{url}}", config)
        assert.equal(result, "https://example.com")
    })

    it("replaces email placeholder", () => {
        const config = { ...baseConfig, email: "test@example.com" }
        const result = renderLicenseText("{{email}}", config)
        assert.equal(result, "test@example.com")
    })

    it("handles missing optional fields", () => {
        const result = renderLicenseText("{{url}} {{email}}", baseConfig)
        assert.equal(result, " ")
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
