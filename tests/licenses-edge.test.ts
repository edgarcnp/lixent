import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
    renderLicenseText,
    getLicenseName,
    convertPlaceholders,
} from "../src/lib/license.ts"
import type { LixentConfig } from "../src/lib/types.ts"

const baseConfig: LixentConfig = {
    copyright: "Test User",
    license: "MIT",
    theme: "minimal",
}

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
        assert.equal(renderLicenseText("No placeholders here", baseConfig), "No placeholders here")
    })

    it("handles empty text", () => {
        assert.equal(renderLicenseText("", baseConfig), "")
    })

    it("uses custom year when provided", () => {
        const config = { ...baseConfig, year: 1999 }
        assert.equal(renderLicenseText("{{year}}", config), "1999")
    })

    it("escapes special regex characters in copyright name", () => {
        const config = { ...baseConfig, copyright: "User (Inc.)" }
        assert.equal(renderLicenseText("{{name}}", config), "User (Inc.)")
    })
})

describe("getLicenseName edge cases", () => {
    it("returns license id for standard license", () => {
        assert.equal(getLicenseName(baseConfig), "MIT")
    })

    it("returns custom license name", () => {
        const config: LixentConfig = {
            ...baseConfig,
            license: "custom",
            customLicense: { name: "Custom", text: "text" },
        }
        assert.equal(getLicenseName(config), "Custom")
    })

    it("returns license id for unknown license", () => {
        const config = { ...baseConfig, license: "UNKNOWN" }
        assert.equal(getLicenseName(config), "UNKNOWN")
    })
})

describe("convertPlaceholders", () => {
    it("converts <year> to {{year}}", () => {
        assert.equal(convertPlaceholders("<year>"), "{{year}}")
    })

    it("converts <copyright holders> to {{name}}", () => {
        assert.equal(convertPlaceholders("<copyright holders>"), "{{name}}")
    })

    it("converts <owner> to {{name}}", () => {
        assert.equal(convertPlaceholders("<owner>"), "{{name}}")
    })

    it("converts [yyyy] to {{year}}", () => {
        assert.equal(convertPlaceholders("[yyyy]"), "{{year}}")
    })

    it("converts [name of copyright owner] to {{name}}", () => {
        assert.equal(convertPlaceholders("[name of copyright owner]"), "{{name}}")
    })

    it("converts [fullname] to {{name}}", () => {
        assert.equal(convertPlaceholders("[fullname]"), "{{name}}")
    })

    it("converts [year] to {{year}}", () => {
        assert.equal(convertPlaceholders("[year]"), "{{year}}")
    })

    it("converts <name of copyright holder> to {{name}}", () => {
        assert.equal(convertPlaceholders("<name of copyright holder>"), "{{name}}")
    })

    it("converts <YEAR> to {{year}} (MIT-0)", () => {
        assert.equal(convertPlaceholders("<YEAR>"), "{{year}}")
    })

    it("converts <COPYRIGHT HOLDER> to {{name}} (MIT-0)", () => {
        assert.equal(convertPlaceholders("<COPYRIGHT HOLDER>"), "{{name}}")
    })

    it("converts <name of author> to {{name}} (GPL-3.0)", () => {
        assert.equal(convertPlaceholders("<name of author>"), "{{name}}")
    })

    it("converts <program> to {{name}} (GPL-3.0)", () => {
        assert.equal(convertPlaceholders("<program>"), "{{name}}")
    })

    it("converts <copyright holder> to {{name}}", () => {
        assert.equal(convertPlaceholders("<copyright holder>"), "{{name}}")
    })

    it("converts [copyright holders] to {{name}} (UPL-1.0)", () => {
        assert.equal(convertPlaceholders("[copyright holders]"), "{{name}}")
    })

    it("handles mixed text around placeholders", () => {
        assert.equal(
            convertPlaceholders("Copyright (c) <year> <owner>"),
            "Copyright (c) {{year}} {{name}}",
        )
    })

    it("does not touch unrelated angle brackets", () => {
        assert.equal(
            convertPlaceholders("Use of < operator or > operator"),
            "Use of < operator or > operator",
        )
    })

    it("does not touch unrelated square brackets", () => {
        assert.equal(
            convertPlaceholders("See section [1] for details"),
            "See section [1] for details",
        )
    })

    it("preserves text without any placeholders", () => {
        assert.equal(convertPlaceholders("MIT License"), "MIT License")
    })

    it("handles multiple placeholders in one line", () => {
        assert.equal(
            convertPlaceholders("Copyright <year> <owner>"),
            "Copyright {{year}} {{name}}",
        )
    })
})

describe("renderLicenseText with SPDX placeholders", () => {
    it("converts and renders MIT-style placeholders", () => {
        const text = "Copyright (c) <year> <copyright holders>"
        const result = renderLicenseText(text, baseConfig)
        const year = String(new Date().getFullYear())
        assert.equal(result, `Copyright (c) ${year} Test User`)
    })

    it("converts and renders BSD-style placeholders", () => {
        const text = "Copyright (c) <year> <owner>"
        const result = renderLicenseText(text, baseConfig)
        const year = String(new Date().getFullYear())
        assert.equal(result, `Copyright (c) ${year} Test User`)
    })

    it("converts and renders Apache-style placeholders", () => {
        const text = "Copyright [yyyy] [name of copyright owner]"
        const result = renderLicenseText(text, baseConfig)
        const year = String(new Date().getFullYear())
        assert.equal(result, `Copyright ${year} Test User`)
    })

    it("preserves unrelated angle brackets in license body", () => {
        const text = "The < operator shall not be replaced"
        const result = renderLicenseText(text, baseConfig)
        assert.equal(result, "The < operator shall not be replaced")
    })

    it("preserves unrelated square brackets in license body", () => {
        const text = "See section [1] for details"
        const result = renderLicenseText(text, baseConfig)
        assert.equal(result, "See section [1] for details")
    })

    it("preserves URLs in angle brackets (GPL-style)", () => {
        const text = "see <https://www.gnu.org/licenses/>"
        const result = renderLicenseText(text, baseConfig)
        assert.equal(result, "see <https://www.gnu.org/licenses/>")
    })

    it("preserves email addresses in angle brackets (WTFPL)", () => {
        const text = "contact <sam@hocevar.net>"
        const result = renderLicenseText(text, baseConfig)
        assert.equal(result, "contact <sam@hocevar.net>")
    })

    it("renders GPL-3.0 placeholder pattern", () => {
        const text = "Copyright (C) <year> <name of author>"
        const result = renderLicenseText(text, baseConfig)
        const year = String(new Date().getFullYear())
        assert.equal(result, `Copyright (C) ${year} Test User`)
    })

    it("renders MIT-0 placeholder pattern", () => {
        const text = "Copyright (c) <YEAR> <COPYRIGHT HOLDER>"
        const result = renderLicenseText(text, baseConfig)
        const year = String(new Date().getFullYear())
        assert.equal(result, `Copyright (c) ${year} Test User`)
    })

    it("renders UPL-1.0 placeholder pattern", () => {
        const text = "Copyright (c) [year] [copyright holders]"
        const result = renderLicenseText(text, baseConfig)
        const year = String(new Date().getFullYear())
        assert.equal(result, `Copyright (c) ${year} Test User`)
    })
})
