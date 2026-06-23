import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { formatYear, formatYearRange } from "../src/lib/year.ts"

describe("formatYear edge cases", () => {
    it("returns year 0 as string", () => {
        assert.equal(formatYear(0), "0")
    })

    it("returns negative year as string", () => {
        assert.equal(formatYear(-500), "-500")
    })

    it("returns large year as string", () => {
        assert.equal(formatYear(99999), "99999")
    })
})

describe("formatYearRange edge cases", () => {
    it("handles same start and end year", () => {
        assert.equal(formatYearRange(2024, 2024), "2024–2024")
    })

    it("handles reversed years", () => {
        assert.equal(formatYearRange(2030, 2020), "2030–2020")
    })

    it("handles zero years", () => {
        assert.equal(formatYearRange(0, 0), "0–0")
    })

    it("handles negative years", () => {
        assert.equal(formatYearRange(-100, -50), "-100–-50")
    })

    it("uses en dash not hyphen", () => {
        const result = formatYearRange(2020, 2024)
        assert.ok(result.includes("\u2013"), "Should use en dash (U+2013)")
        assert.ok(!result.includes("-") || result.includes("\u2013"), "Should not use hyphen")
    })
})
