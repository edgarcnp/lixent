import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
    buildConfigJson,
    buildPreviewConfig,
    CUSTOM_THEME_DEFAULTS,
    DEFAULTS,
    type DemoSettings,
} from "../src/site/demo/settings.ts"

function settings(overrides: Partial<DemoSettings> = {}): DemoSettings {
    return {
        theme: DEFAULTS.theme,
        font: DEFAULTS.font,
        fontSize: "",
        fontWeight: "",
        lineHeight: "",
        letterSpacing: "",
        license: DEFAULTS.license,
        copyright: "Jane Doe",
        email: "",
        url: "",
        yearInput: "",
        yearStart: "",
        yearEnd: "",
        yearMode: "single",
        gravatar: false,
        customLicenseName: "",
        customLicenseText: "",
        customThemeBg: "",
        customThemeText: "",
        customThemeTextMuted: "",
        customThemeAccent: "",
        customThemeBorder: "",
        ...overrides,
    }
}

function themeOf(config: Record<string, unknown>): Record<string, unknown> {
    const theme = config.theme
    assert.ok(typeof theme === "object" && theme !== null)
    return theme as Record<string, unknown>
}

describe("buildConfigJson", () => {
    it("emits identity fields and the theme preset", () => {
        const config = buildConfigJson(settings())
        assert.equal(config.copyright, "Jane Doe")
        assert.equal(config.license, "MIT")
        assert.deepEqual(config.theme, { preset: "minimal-dark" })
        assert.equal("font" in themeOf(config), false)
    })

    it("omits empty optional fields", () => {
        const config = buildConfigJson(settings())
        assert.equal("url" in config, false)
        assert.equal("email" in config, false)
        assert.equal("gravatar" in config, false)
        assert.equal("year" in config, false)
        assert.equal("yearRange" in config, false)
    })

    it("emits custom theme colors with defaults applied", () => {
        const config = buildConfigJson(settings({ theme: "custom" }))
        assert.deepEqual(themeOf(config), {
            preset: "minimal-dark",
            colors: { ...CUSTOM_THEME_DEFAULTS },
        })
    })

    it("emits typography and non-default fonts", () => {
        const config = buildConfigJson(settings({
            font: "Merriweather",
            fontSize: "18px",
            fontWeight: "700",
            lineHeight: "1.6",
            letterSpacing: "0.02em",
        }))
        assert.deepEqual(themeOf(config), {
            preset: "minimal-dark",
            font: "Merriweather",
            fontSize: "18px",
            fontWeight: "700",
            lineHeight: "1.6",
            letterSpacing: "0.02em",
        })
    })

    it("emits custom licenses", () => {
        const config = buildConfigJson(settings({
            license: "custom",
            customLicenseName: "Mine",
            customLicenseText: "text",
        }))
        assert.equal(config.license, "custom")
        assert.deepEqual(config.customLicense, { name: "Mine", text: "text" })
    })

    it("emits explicit and ranged years", () => {
        const single = buildConfigJson(settings({ yearInput: "1999" }))
        assert.equal(single.year, 1999)
        const range = buildConfigJson(settings({ yearMode: "range", yearStart: "1999", yearEnd: "2005" }))
        assert.deepEqual(range.yearRange, { start: 1999, end: 2005 })
    })
})

describe("buildPreviewConfig", () => {
    it("produces a valid config for style resolution", () => {
        const config = buildPreviewConfig(settings({ font: "Inter" }))
        assert.equal(config.copyright, "Jane Doe")
        assert.equal(config.license, "MIT")
        assert.equal(config.gravatar, false)
        assert.equal(config.theme.preset, "minimal-dark")
        assert.equal(config.theme.font, "Inter")
    })

    it("maps the custom theme card to preset plus colors", () => {
        const config = buildPreviewConfig(settings({ theme: "custom", customThemeAccent: "#ff0000" }))
        const colors = config.theme.colors
        assert.equal(config.theme.preset, "minimal-dark")
        assert.ok(colors !== undefined)
        assert.equal(colors.accent, "#ff0000")
        assert.equal(colors.bg, CUSTOM_THEME_DEFAULTS.bg)
    })
})
