import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
    BUILT_IN_THEMES,
    getTheme,
    isBuiltInTheme,
    THEME_COLOR_KEYS,
    THEME_VARIABLES,
} from "../src/core/theme/catalog.ts"
import { resolveStyle } from "../src/core/theme/style.ts"
import type { LixentConfig } from "../src/core/config/types.ts"

function config(theme: LixentConfig["theme"]): LixentConfig {
    return { copyright: "Jane Doe", license: "MIT", gravatar: false, theme }
}

describe("theme catalog", () => {
    it("defines every variable for every theme", () => {
        assert.equal(BUILT_IN_THEMES.length, 16)
        for (const theme of BUILT_IN_THEMES) {
            for (const variable of THEME_VARIABLES) {
                assert.ok(theme.vars[variable].length > 0, `${theme.id} is missing ${variable}`)
            }
        }
    })

    it("has unique ids", () => {
        const ids = new Set(BUILT_IN_THEMES.map((theme) => theme.id))
        assert.equal(ids.size, BUILT_IN_THEMES.length)
    })

    it("includes light and dark variants", () => {
        assert.ok(BUILT_IN_THEMES.some((theme) => theme.dark))
        assert.ok(BUILT_IN_THEMES.some((theme) => !theme.dark))
    })

    it("keeps known theme values", () => {
        assert.equal(getTheme("minimal")?.vars["--lx-bg"], "#faf9f7")
        assert.equal(getTheme("terminal")?.vars["--lx-text"], "#33ff33")
        assert.equal(getTheme("minimal")?.name, "Minimal")
    })

    it("recognizes built-in themes only", () => {
        assert.equal(isBuiltInTheme("minimal"), true)
        assert.equal(isBuiltInTheme("nope"), false)
        assert.equal(isBuiltInTheme("/custom.css"), false)
    })

    it("exposes six variables and five color keys", () => {
        assert.equal(THEME_VARIABLES.length, 6)
        assert.deepEqual([...THEME_COLOR_KEYS], ["bg", "text", "textMuted", "accent", "border"])
    })
})

describe("resolveStyle", () => {
    it("emits the preset variables", () => {
        const style = resolveStyle(config({ preset: "minimal" }))
        assert.match(style.style, /--lx-bg: #faf9f7/)
        assert.equal(style.fontHref, null)
        assert.equal(style.themeHref, null)
    })

    it("lets color overrides win over the preset", () => {
        const style = resolveStyle(config({ preset: "minimal", colors: { accent: "#0af" } }))
        assert.match(style.style, /--lx-accent: #0af/)
        assert.doesNotMatch(style.style, /--lx-accent: #2563eb/)
    })

    it("resolves a configured font and weight", () => {
        const style = resolveStyle(config({ preset: "minimal", font: "Inter", fontWeight: "700" }))
        assert.match(style.style, /--lx-font-body: "Inter", system-ui/)
        assert.match(style.style, /--lx-font-weight: 700/)
        assert.equal(style.fontHref, "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap")
    })

    it("emits typography overrides", () => {
        const style = resolveStyle(config({
            preset: "minimal",
            fontSize: "1.125rem",
            lineHeight: "1.6",
            letterSpacing: "0.02em",
        }))
        assert.match(style.style, /--lx-font-size: 1\.125rem/)
        assert.match(style.style, /--lx-line-height: 1\.6/)
        assert.match(style.style, /--lx-letter-spacing: 0\.02em/)
    })

    it("returns an external href for path presets", () => {
        const style = resolveStyle(config({ preset: "/my-theme.css" }))
        assert.equal(style.themeHref, "/my-theme.css")
        assert.equal(style.style, "")
    })

    it("strips url() as a render-time safety net", () => {
        const style = resolveStyle(config({ preset: "minimal", colors: { bg: "url(https://evil.example)" } }))
        assert.doesNotMatch(style.style, /url\(/)
        assert.match(style.style, /--lx-bg: https:\/\/evil\.example\)/)
    })
})
