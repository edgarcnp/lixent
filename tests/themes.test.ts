import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { themes, getTheme, isValidTheme } from "../src/themes/index.ts"

describe("themes", () => {
    it("each theme has required fields", () => {
        for (const theme of themes) {
            assert.ok(theme.id, `Theme missing id`)
            assert.ok(theme.name, `Theme ${theme.id} missing name`)
            assert.equal(typeof theme.dark, "boolean", `Theme ${theme.id} dark is not boolean`)
            assert.ok(theme.preview.bg, `Theme ${theme.id} missing preview.bg`)
            assert.ok(theme.preview.accent, `Theme ${theme.id} missing preview.accent`)
            assert.ok(theme.preview.text, `Theme ${theme.id} missing preview.text`)
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
        const theme = getTheme("minimal-dark")
        assert.ok(theme)
        assert.equal(theme.id, "minimal-dark")
        assert.equal(theme.name, "Minimal Dark")
        assert.equal(theme.dark, true)
    })

    it("returns light theme", () => {
        const theme = getTheme("terminal-light")
        assert.ok(theme)
        assert.equal(theme.dark, false)
    })

    it("returns undefined for unknown theme", () => {
        assert.equal(getTheme("nonexistent"), undefined)
    })
})

describe("isValidTheme", () => {
    it("returns true for valid themes", () => {
        assert.ok(isValidTheme("minimal-dark"))
        assert.ok(isValidTheme("github-dark"))
        assert.ok(isValidTheme("terminal"))
        assert.ok(isValidTheme("serif-dark"))
    })

    it("returns false for invalid theme", () => {
        assert.equal(isValidTheme("not-a-theme"), false)
        assert.equal(isValidTheme(""), false)
    })
})
