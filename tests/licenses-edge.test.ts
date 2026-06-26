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
    theme: "minimal-dark",
}

const baseValues = { year: "2026", name: "Test User" }

describe("renderLicenseText edge cases", () => {
    it("replaces all placeholders in one pass", () => {
        const values = { ...baseValues, email: "test@example.com" }
        assert.equal(renderLicenseText("Copyright {{year}} {{name}} ({{email}})", values), "Copyright 2026 Test User (test@example.com)")
    })

    it("handles multiple {{year}} occurrences", () => {
        assert.equal(renderLicenseText("{{year}} to {{year}}", baseValues), "2026 to 2026")
    })

    it("handles text with no placeholders", () => {
        assert.equal(renderLicenseText("No placeholders here", baseValues), "No placeholders here")
    })

    it("handles empty text", () => {
        assert.equal(renderLicenseText("", baseValues), "")
    })

    it("uses custom year when provided", () => {
        assert.equal(renderLicenseText("{{year}}", { ...baseValues, year: "1999" }), "1999")
    })

    it("escapes special regex characters in copyright name", () => {
        assert.equal(renderLicenseText("{{name}}", { ...baseValues, name: "User (Inc.)" }), "User (Inc.)")
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
        assert.equal(
            renderLicenseText("Copyright (c) <year> <copyright holders>", baseValues),
            "Copyright (c) 2026 Test User",
        )
    })

    it("converts and renders BSD-style placeholders", () => {
        assert.equal(
            renderLicenseText("Copyright (c) <year> <owner>", baseValues),
            "Copyright (c) 2026 Test User",
        )
    })

    it("converts and renders Apache-style placeholders", () => {
        assert.equal(
            renderLicenseText("Copyright [yyyy] [name of copyright owner]", baseValues),
            "Copyright 2026 Test User",
        )
    })

    it("preserves unrelated angle brackets in license body", () => {
        assert.equal(
            renderLicenseText("The < operator shall not be replaced", baseValues),
            "The < operator shall not be replaced",
        )
    })

    it("preserves unrelated square brackets in license body", () => {
        assert.equal(
            renderLicenseText("See section [1] for details", baseValues),
            "See section [1] for details",
        )
    })

    it("preserves URLs in angle brackets (GPL-style)", () => {
        assert.equal(
            renderLicenseText("see <https://www.gnu.org/licenses/>", baseValues),
            "see <https://www.gnu.org/licenses/>",
        )
    })

    it("preserves email addresses in angle brackets (WTFPL)", () => {
        assert.equal(
            renderLicenseText("contact <sam@hocevar.net>", baseValues),
            "contact <sam@hocevar.net>",
        )
    })

    it("renders GPL-3.0 placeholder pattern", () => {
        assert.equal(
            renderLicenseText("Copyright (C) <year> <name of author>", baseValues),
            "Copyright (C) 2026 Test User",
        )
    })

    it("renders MIT-0 placeholder pattern", () => {
        assert.equal(
            renderLicenseText("Copyright (c) <YEAR> <COPYRIGHT HOLDER>", baseValues),
            "Copyright (c) 2026 Test User",
        )
    })

    it("renders UPL-1.0 placeholder pattern", () => {
        assert.equal(
            renderLicenseText("Copyright (c) [year] [copyright holders]", baseValues),
            "Copyright (c) 2026 Test User",
        )
    })
})
