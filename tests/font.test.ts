import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { getGoogleFontsUrl, cssWeightToVariants } from "../src/lib/font.ts"

describe("getGoogleFontsUrl", () => {
    it("returns null for empty family", () => {
        assert.equal(getGoogleFontsUrl(""), null)
    })

    it("rejects invalid characters", () => {
        assert.equal(getGoogleFontsUrl("Inter{"), null)
    })

    it("builds URL with default regular weight", () => {
        const url = getGoogleFontsUrl("Inter")
        assert.ok(url?.includes("family=Inter:wght@400"))
        assert.ok(url?.includes("display=swap"))
    })

    it("builds URL with multiple weights", () => {
        const url = getGoogleFontsUrl("Inter", ["regular", "500", "700"])
        assert.ok(url?.includes("family=Inter:wght@400;500;700"))
    })

    it("handles spaces in family name", () => {
        const url = getGoogleFontsUrl("Open Sans")
        assert.ok(url?.includes("family=Open+Sans"))
    })
})

describe("cssWeightToVariants", () => {
    it("returns regular for undefined", () => {
        assert.deepEqual(cssWeightToVariants(), ["regular"])
    })

    it("returns regular for empty string", () => {
        assert.deepEqual(cssWeightToVariants(""), ["regular"])
    })

    it("returns regular for 400", () => {
        assert.deepEqual(cssWeightToVariants("400"), ["regular"])
    })

    it("returns regular for normal", () => {
        assert.deepEqual(cssWeightToVariants("normal"), ["regular"])
    })

    it("returns regular + weight for 700", () => {
        assert.deepEqual(cssWeightToVariants("700"), ["regular", "700"])
    })

    it("returns regular + 700 for bold", () => {
        assert.deepEqual(cssWeightToVariants("bold"), ["regular", "700"])
    })

    it("returns regular + weight for 300", () => {
        assert.deepEqual(cssWeightToVariants("300"), ["regular", "300"])
    })

    it("returns regular + weight for 500", () => {
        assert.deepEqual(cssWeightToVariants("500"), ["regular", "500"])
    })
})
