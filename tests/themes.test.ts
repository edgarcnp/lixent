import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { getTheme, isValidTheme } from "../src/themes/index.ts"

describe("getTheme", () => {
    it("returns theme by id", () => {
        const theme = getTheme("minimal")
        assert.ok(theme)
        assert.equal(theme.id, "minimal")
        assert.equal(theme.name, "Minimal")
        assert.equal(theme.dark, false)
    })

    it("returns dark theme", () => {
        const theme = getTheme("terminal")
        assert.ok(theme)
        assert.equal(theme.dark, true)
    })

    it("returns undefined for unknown theme", () => {
        assert.equal(getTheme("nonexistent"), undefined)
    })
})

describe("isValidTheme", () => {
    it("returns true for valid themes", () => {
        assert.ok(isValidTheme("minimal"))
        assert.ok(isValidTheme("github"))
        assert.ok(isValidTheme("terminal"))
        assert.ok(isValidTheme("sans"))
    })

    it("returns false for invalid theme", () => {
        assert.equal(isValidTheme("not-a-theme"), false)
        assert.equal(isValidTheme(""), false)
    })
})
