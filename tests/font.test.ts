import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { cssWeightToVariants, getGoogleFontsUrl } from "../src/core/theme/font.ts"

describe("getGoogleFontsUrl", () => {
    it("returns null for an empty family", () => {
        assert.equal(getGoogleFontsUrl(""), null)
    })

    it("rejects invalid characters", () => {
        assert.equal(getGoogleFontsUrl("Inter<script>"), null)
    })

    it("builds a URL with the default regular weight", () => {
        assert.equal(
            getGoogleFontsUrl("Inter"),
            "https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap",
        )
    })

    it("builds a URL with multiple weights", () => {
        assert.equal(
            getGoogleFontsUrl("Inter", ["regular", "500", "700"]),
            "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap",
        )
    })

    it("handles spaces in the family name", () => {
        assert.equal(
            getGoogleFontsUrl("IBM Plex Mono"),
            "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&display=swap",
        )
    })
})

describe("cssWeightToVariants", () => {
    it("returns regular for undefined or empty input", () => {
        assert.deepEqual(cssWeightToVariants(), ["regular"])
        assert.deepEqual(cssWeightToVariants(""), ["regular"])
    })

    it("normalizes named weights", () => {
        assert.deepEqual(cssWeightToVariants("normal"), ["regular"])
        assert.deepEqual(cssWeightToVariants("400"), ["regular"])
        assert.deepEqual(cssWeightToVariants("bold"), ["regular", "700"])
    })

    it("keeps numeric weights", () => {
        assert.deepEqual(cssWeightToVariants("300"), ["regular", "300"])
        assert.deepEqual(cssWeightToVariants("700"), ["regular", "700"])
    })
})
