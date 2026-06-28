import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { getGravatarUrl } from "../src/lib/gravatar.ts"

describe("getGravatarUrl", () => {
    it("returns valid gravatar URL", async () => {
        const url = await getGravatarUrl("test@example.com")
        assert.ok(url.startsWith("https://www.gravatar.com/avatar/"))
        assert.ok(url.includes("s=80"))
        assert.ok(url.includes("d=mp"))
    })

    it("uses custom size", async () => {
        const url = await getGravatarUrl("test@example.com", 128)
        assert.ok(url.includes("s=128"))
    })

    it("uses custom default type", async () => {
        const url = await getGravatarUrl("test@example.com", 80, "identicon")
        assert.ok(url.includes("d=identicon"))
    })

    it("lowercases and trims email", async () => {
        const url = await getGravatarUrl("  Test@Example.COM  ")
        const urlLower = await getGravatarUrl("test@example.com")
        assert.equal(url, urlLower)
    })
})
