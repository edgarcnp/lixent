import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { formatYear, formatYearRange } from "../src/lib/year.ts"

describe("formatYear", () => {
    it("returns current year when called without argument", () => {
        const current = String(new Date().getFullYear())
        assert.equal(formatYear(), current)
    })

    it("formats a given year", () => {
        assert.equal(formatYear(2026), "2026")
    })

    it("formats year zero", () => {
        assert.equal(formatYear(0), "0")
    })

    it("formats negative years", () => {
        assert.equal(formatYear(-100), "-100")
    })
})

describe("formatYearRange", () => {
    it("formats a year range with en dash", () => {
        assert.equal(formatYearRange(2020, 2026), "2020–2026")
    })

    it("formats same start and end year", () => {
        assert.equal(formatYearRange(2026, 2026), "2026–2026")
    })

    it("formats historical range", () => {
        assert.equal(formatYearRange(1990, 2000), "1990–2000")
    })
})
