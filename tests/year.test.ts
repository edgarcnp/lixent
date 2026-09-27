import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { formatYear, formatYearRange } from "../src/core/year.ts"

describe("formatYear", () => {
    it("returns the current year when called without an argument", () => {
        assert.equal(formatYear(), String(new Date().getFullYear()))
    })

    it("formats an explicit year", () => {
        assert.equal(formatYear(2024), "2024")
    })

    it("formats year zero and negative years", () => {
        assert.equal(formatYear(0), "0")
        assert.equal(formatYear(-100), "-100")
    })
})

describe("formatYearRange", () => {
    it("uses an en dash", () => {
        assert.equal(formatYearRange(2020, 2026), "2020–2026")
    })

    it("handles equal and reversed ranges", () => {
        assert.equal(formatYearRange(2024, 2024), "2024–2024")
        assert.equal(formatYearRange(2026, 2020), "2026–2020")
    })
})
