import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { getGravatarUrl } from "../src/core/gravatar.ts"

describe("getGravatarUrl", () => {
    it("returns a valid Gravatar URL", async () => {
        const url = await getGravatarUrl("test@example.com")
        assert.match(url, /^https:\/\/www\.gravatar\.com\/avatar\/[a-f0-9]{64}\?s=80&d=mp$/)
    })

    it("uses a custom size", async () => {
        const url = await getGravatarUrl("test@example.com", 200)
        assert.match(url, /\?s=200&d=mp$/)
    })

    it("uses a custom default type", async () => {
        const url = await getGravatarUrl("test@example.com", 80, "identicon")
        assert.match(url, /\?s=80&d=identicon$/)
    })

    it("lowercases and trims the email", async () => {
        const normalized = await getGravatarUrl("  TEST@Example.com ")
        const expected = await getGravatarUrl("test@example.com")
        assert.equal(normalized, expected)
    })

    it("produces different hashes for different emails", async () => {
        const first = await getGravatarUrl("a@example.com")
        const second = await getGravatarUrl("b@example.com")
        assert.notEqual(first, second)
    })
})
