import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { renderLicenseText } from "../src/lib/license.ts"

const baseValues = { year: "2026", name: "Test User" }

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
