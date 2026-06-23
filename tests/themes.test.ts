import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { themes, getTheme, isValidTheme } from "../src/themes/index.ts"

describe("themes", () => {
    it("contains 10 themes", () => {
        assert.equal(themes.length, 10)
    })

    it("each theme has required fields", () => {
        for (const theme of themes) {
            assert.ok(theme.id, `Theme missing id`)
            assert.ok(theme.name, `Theme ${theme.id} missing name`)
            assert.ok(theme.description, `Theme ${theme.id} missing description`)
            assert.equal(typeof theme.dark, "boolean", `Theme ${theme.id} dark is not boolean`)
            assert.ok(Array.isArray(theme.variables), `Theme ${theme.id} variables is not array`)
        }
    })

    it("each theme has unique id", () => {
        const ids = themes.map((t) => t.id)
        const unique = new Set(ids)
        assert.equal(ids.length, unique.size)
    })
})

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
