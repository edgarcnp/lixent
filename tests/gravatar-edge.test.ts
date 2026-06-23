import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { getGravatarUrl } from "../src/lib/gravatar.ts"

describe("getGravatarUrl edge cases", () => {
    it("produces consistent hashes for same email", () => {
        const url1 = getGravatarUrl("test@example.com")
        const url2 = getGravatarUrl("test@example.com")
        assert.equal(url1, url2)
    })

    it("produces different hashes for different emails", () => {
        const url1 = getGravatarUrl("a@example.com")
        const url2 = getGravatarUrl("b@example.com")
        assert.notEqual(url1, url2)
    })

    it("handles email with special characters", () => {
        const url = getGravatarUrl("user+tag@example.com")
        assert.ok(url.startsWith("https://www.gravatar.com/avatar/"))
        assert.ok(url.includes("?s=80"))
    })

    it("handles very long email", () => {
        const longEmail = "a".repeat(255) + "@example.com"
        const url = getGravatarUrl(longEmail)
        assert.ok(url.startsWith("https://www.gravatar.com/avatar/"))
    })

    it("uses size 1 as minimum", () => {
        const url = getGravatarUrl("test@example.com", 1)
        assert.ok(url.includes("s=1"))
    })

    it("uses large size", () => {
        const url = getGravatarUrl("test@example.com", 1024)
        assert.ok(url.includes("s=1024"))
    })

    it("all default types produce valid URLs", () => {
        const defaults = ["mp", "identicon", "monsterid", "wavatar", "retro", "robohash", "blank"] as const
        for (const d of defaults) {
            const url = getGravatarUrl("test@example.com", 80, d)
            assert.ok(url.includes(`d=${d}`), `Failed for default type: ${d}`)
        }
    })
})
