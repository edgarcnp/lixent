import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { renderLicenseText } from "../src/core/license/render.ts"
import { toCanonicalPlaceholders } from "../src/core/license/placeholders.ts"

const VALUES = {
    year: "2026",
    name: "Test User",
    url: "https://example.com",
    email: "test@example.com",
}

describe("renderLicenseText", () => {
    it("substitutes canonical tokens", () => {
        assert.equal(renderLicenseText("{{year}} {{name}}", VALUES), "2026 Test User")
    })

    it("substitutes url and email", () => {
        assert.equal(renderLicenseText("{{url}} {{email}}", VALUES), "https://example.com test@example.com")
    })

    it("renders missing optional values as empty strings", () => {
        assert.equal(renderLicenseText("{{url}}{{email}}", { year: "2026", name: "Test User" }), "")
    })

    it("replaces every occurrence", () => {
        assert.equal(renderLicenseText("{{year}}x{{year}}", VALUES), "2026x2026")
    })

    it("leaves unknown tokens untouched", () => {
        assert.equal(renderLicenseText("{{unknown}} {{year}}", VALUES), "{{unknown}} 2026")
    })

    it("handles empty text", () => {
        assert.equal(renderLicenseText("", VALUES), "")
    })

    it("does not reinterpret replacement patterns", () => {
        assert.equal(renderLicenseText("by {{name}}", { ...VALUES, name: "A$&B" }), "by A$&B")
        assert.equal(renderLicenseText("by {{name}}", { ...VALUES, name: "$'" }), "by $'")
        assert.equal(renderLicenseText("by {{name}}", { ...VALUES, name: "$1" }), "by $1")
        assert.equal(renderLicenseText("by {{name}}", { ...VALUES, name: "User (Inc.)" }), "by User (Inc.)")
    })

    it("converts MIT-style placeholders", () => {
        assert.equal(
            renderLicenseText("Copyright (c) <year> <copyright holders>", VALUES),
            "Copyright (c) 2026 Test User",
        )
    })

    it("converts BSD-style placeholders", () => {
        assert.equal(renderLicenseText("Copyright (c) <year> <owner>", VALUES), "Copyright (c) 2026 Test User")
    })

    it("converts Apache-style placeholders", () => {
        assert.equal(
            renderLicenseText("Copyright [yyyy] [name of copyright owner]", VALUES),
            "Copyright 2026 Test User",
        )
    })

    it("converts GPL-style placeholders", () => {
        assert.equal(renderLicenseText("Copyright (C) <year> <name of author>", VALUES), "Copyright (C) 2026 Test User")
    })

    it("preserves URLs and emails in angle brackets", () => {
        assert.equal(renderLicenseText("<https://gnu.org>", VALUES), "<https://gnu.org>")
        assert.equal(renderLicenseText("<foo@example.com>", VALUES), "<foo@example.com>")
    })

    it("preserves unrelated square brackets", () => {
        assert.equal(renderLicenseText("[not a placeholder]", VALUES), "[not a placeholder]")
    })
})

describe("toCanonicalPlaceholders", () => {
    it("converts all known dialects to canonical tokens", () => {
        assert.equal(
            toCanonicalPlaceholders("<year> <copyright holders> [yyyy] [fullname] <program>"),
            "{{year}} {{name}} {{year}} {{name}} {{name}}",
        )
    })
})
