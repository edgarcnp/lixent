import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
    getLicense,
    isValidLicense,
    renderLicenseText,
    getLicenseText,
    getLicenseName,
    CORE_LICENSE_IDS,
} from "../src/lib/license.ts"
import type { LixentConfig } from "../src/lib/types.ts"

const baseConfig: LixentConfig = {
    copyright: "Test User",
    license: "MIT",
    theme: "minimal",
}

describe("getLicense", () => {
    it("returns MIT license", () => {
        const license = getLicense("MIT")
        assert.ok(license)
        assert.equal(license.id, "MIT")
        assert.equal(license.name, "MIT License")
        assert.ok(license.text.includes("MIT License"))
    })

    it("returns undefined for unknown license", () => {
        assert.equal(getLicense("UNKNOWN"), undefined)
    })
})

describe("isValidLicense", () => {
    it("returns true for valid licenses", () => {
        assert.ok(isValidLicense("MIT"))
        assert.ok(isValidLicense("Apache-2.0"))
        assert.ok(isValidLicense("GPL-3.0-only"))
    })

    it("returns false for invalid license", () => {
        assert.equal(isValidLicense("NOT_A_LICENSE"), false)
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
        const text = "{{name}}"
        const result = renderLicenseText(text, baseConfig)
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

describe("getLicenseText", () => {
    it("returns rendered MIT license", () => {
        const text = getLicenseText(baseConfig)
        assert.ok(text.includes("MIT License"))
        assert.ok(text.includes("Test User"))
    })

    it("returns custom license text", () => {
        const config: LixentConfig = {
            ...baseConfig,
            license: "custom",
            customLicense: {
                name: "Custom",
                text: "Custom license for {{name}}",
            },
        }
        const text = getLicenseText(config)
        assert.equal(text, "Custom license for Test User")
    })

    it("returns error message for unknown license", () => {
        const config = { ...baseConfig, license: "UNKNOWN" }
        const text = getLicenseText(config)
        assert.ok(text.includes("License not found"))
    })
})

describe("getLicenseName", () => {
    it("returns license name", () => {
        assert.equal(getLicenseName(baseConfig), "MIT License")
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

describe("CORE_LICENSE_IDS", () => {
    it("contains all SPDX licenses", () => {
        assert.ok(CORE_LICENSE_IDS.length > 15)
    })

    it("includes MIT", () => {
        assert.ok(CORE_LICENSE_IDS.includes("MIT"))
    })
})
