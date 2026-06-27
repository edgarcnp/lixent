import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { themes, getTheme, isValidTheme } from "../src/themes/index.ts"

const THEMES_DIR = resolve(import.meta.dirname, "../public/themes")

describe("themes", () => {
    it("has at least one theme", () => {
        assert.ok(themes.length > 0)
    })

    it("each theme has required fields", () => {
        for (const theme of themes) {
            assert.ok(theme.id, `Theme missing id`)
            assert.ok(theme.name, `Theme ${theme.id} missing name`)
            assert.ok(theme.description, `Theme ${theme.id} missing description`)
            assert.equal(typeof theme.dark, "boolean", `Theme ${theme.id} dark is not boolean`)
        }
    })

    it("each theme has unique id", () => {
        const ids = themes.map((t) => t.id)
        const unique = new Set(ids)
        assert.equal(ids.length, unique.size)
    })

    it("each theme has a corresponding CSS file", () => {
        for (const theme of themes) {
            const cssPath = resolve(THEMES_DIR, `${theme.id}.css`)
            assert.ok(existsSync(cssPath), `Theme ${theme.id} missing CSS file at ${cssPath}`)
        }
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
