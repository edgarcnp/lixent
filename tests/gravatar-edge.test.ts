import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { getGravatarUrl } from "../src/lib/gravatar.ts"

describe("getGravatarUrl edge cases", () => {
    it("produces consistent hashes for same email", async () => {
        const url1 = await getGravatarUrl("test@example.com")
        const url2 = await getGravatarUrl("test@example.com")
        assert.equal(url1, url2)
    })

    it("produces different hashes for different emails", async () => {
        const url1 = await getGravatarUrl("a@example.com")
        const url2 = await getGravatarUrl("b@example.com")
        assert.notEqual(url1, url2)
    })

    it("handles email with special characters", async () => {
        const url = await getGravatarUrl("user+tag@example.com")
        assert.ok(url.startsWith("https://www.gravatar.com/avatar/"))
        assert.ok(url.includes("?s=80"))
    })

    it("handles very long email", async () => {
        const longEmail = "a".repeat(255) + "@example.com"
        const url = await getGravatarUrl(longEmail)
        assert.ok(url.startsWith("https://www.gravatar.com/avatar/"))
    })

    it("uses size 1 as minimum", async () => {
        const url = await getGravatarUrl("test@example.com", 1)
        assert.ok(url.includes("s=1"))
    })

    it("uses large size", async () => {
        const url = await getGravatarUrl("test@example.com", 1024)
        assert.ok(url.includes("s=1024"))
    })

    it("all default types produce valid URLs", async () => {
        const defaults = ["mp", "identicon", "monsterid", "wavatar", "retro", "robohash", "blank"] as const
        for (const d of defaults) {
            const url = await getGravatarUrl("test@example.com", 80, d)
            assert.ok(url.includes(`d=${d}`), `Failed for default type: ${d}`)
        }
    })
})
