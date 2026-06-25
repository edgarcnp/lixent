import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
    getLicense,
    isValidLicense,
    renderLicenseText,
    getLicenseText,
    getLicenseName,
    CORE_LICENSE_IDS,
} from "../src/licenses/index.ts"
import type { LixentConfig } from "../src/lib/types.ts"

const baseConfig: LixentConfig = {
    copyright: "Test User",
    license: "MIT",
    theme: "minimal",
}

describe("getLicense edge cases", () => {
    it("all core licenses are retrievable", () => {
        for (const id of CORE_LICENSE_IDS) {
            const license = getLicense(id)
            assert.ok(license, `License ${id} not found`)
            assert.equal(license.id, id)
            assert.ok(license.name.length > 0, `License ${id} has empty name`)
            assert.ok(license.text.length > 0, `License ${id} has empty text`)
        }
    })

    it("returns undefined for empty string", () => {
        assert.equal(getLicense(""), undefined)
    })

    it("returns undefined for case-sensitive mismatch", () => {
        assert.equal(getLicense("mit"), undefined)
        assert.equal(getLicense("MIT LICENSE"), undefined)
    })
})

describe("isValidLicense edge cases", () => {
    it("all core licenses are valid", () => {
        for (const id of CORE_LICENSE_IDS) {
            assert.ok(isValidLicense(id), `License ${id} should be valid`)
        }
    })

    it("returns false for partial match", () => {
        assert.equal(isValidLicense("MIT-LICENSE"), false)
        assert.equal(isValidLicense("LICENSE-MIT"), false)
    })

    it("returns false for whitespace", () => {
        assert.equal(isValidLicense(" "), false)
        assert.equal(isValidLicense("\t"), false)
    })
})

describe("renderLicenseText edge cases", () => {
    it("replaces all placeholders in one pass", () => {
        const text = "Copyright {{year}} {{name}} ({{email}})"
        const config = { ...baseConfig, email: "test@example.com" }
        const result = renderLicenseText(text, config)
        const year = String(new Date().getFullYear())
        assert.equal(result, `Copyright ${year} Test User (test@example.com)`)
    })

    it("handles multiple {{year}} occurrences", () => {
        const text = "{{year}} to {{year}}"
        const result = renderLicenseText(text, baseConfig)
        const year = String(new Date().getFullYear())
        assert.equal(result, `${year} to ${year}`)
    })

    it("handles text with no placeholders", () => {
        const text = "No placeholders here"
        assert.equal(renderLicenseText(text, baseConfig), text)
    })

    it("handles empty text", () => {
        assert.equal(renderLicenseText("", baseConfig), "")
    })

    it("uses custom year when provided", () => {
        const config = { ...baseConfig, year: 1999 }
        const result = renderLicenseText("{{year}}", config)
        assert.equal(result, "1999")
    })

    it("escapes special regex characters in copyright name", () => {
        const config = { ...baseConfig, copyright: "User (Inc.)" }
        const result = renderLicenseText("{{name}}", config)
        assert.equal(result, "User (Inc.)")
    })
})

describe("getLicenseText edge cases", () => {
    it("renders all core licenses without errors", () => {
        for (const id of CORE_LICENSE_IDS) {
            const config = { ...baseConfig, license: id }
            const text = getLicenseText(config)
            assert.ok(text.length > 0, `License ${id} produced empty text`)
            assert.ok(!text.includes("{{"), `License ${id} has unreplaced placeholders`)
        }
    })

    it("custom license with all placeholders", () => {
        const config: LixentConfig = {
            ...baseConfig,
            license: "custom",
            customLicense: {
                name: "Test",
                text: "{{year}} {{name}} {{url}} {{email}}",
            },
            url: "https://example.com",
            email: "test@example.com",
        }
        const text = getLicenseText(config)
        const year = String(new Date().getFullYear())
        assert.equal(text, `${year} Test User https://example.com test@example.com`)
    })

    it("custom license without customLicense object returns error", () => {
        const config: LixentConfig = {
            ...baseConfig,
            license: "custom",
        }
        const text = getLicenseText(config)
        assert.ok(text.includes("License not found"))
    })
})

describe("getLicenseName edge cases", () => {
    it("returns correct name for all core licenses", () => {
        for (const id of CORE_LICENSE_IDS) {
            const config = { ...baseConfig, license: id }
            const name = getLicenseName(config)
            assert.ok(name.length > 0, `License ${id} has empty name`)
        }
    })

    it("returns license id for unknown license", () => {
        const config = { ...baseConfig, license: "UNKNOWN" }
        assert.equal(getLicenseName(config), "UNKNOWN")
    })
})

describe("CORE_LICENSE_IDS", () => {
    it("contains all expected licenses", () => {
        const expected = [
            "MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC",
            "MPL-2.0", "GPL-2.0-only", "GPL-3.0-only", "LGPL-2.1-only",
            "LGPL-3.0-only", "AGPL-3.0-only", "Unlicense", "CC0-1.0",
            "WTFPL", "0BSD",
        ]
        assert.deepEqual(CORE_LICENSE_IDS.sort(), expected.sort())
    })
})
