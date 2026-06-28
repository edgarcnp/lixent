import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { renderLicenseText } from "../src/lib/license.ts"

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
