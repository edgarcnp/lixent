import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { formatYear, formatYearRange } from "../src/lib/year.ts"

describe("formatYear", () => {
    it("returns current year when no argument", () => {
        const currentYear = new Date().getFullYear()
        assert.equal(formatYear(), String(currentYear))
    })

    it("returns given year as string", () => {
        assert.equal(formatYear(2024), "2024")
    })
})

describe("formatYearRange", () => {
    it("formats year range with en dash", () => {
        assert.equal(formatYearRange(2020, 2024), "2020–2024")
    })
})
