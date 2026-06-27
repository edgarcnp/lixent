import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
    assertValidUrl,
    assertValidEmail,
    assertValidFont,
    assertValidCopyright,
    assertValidYear,
    assertValidCustomName,
    assertValidCustomText,
    assertValidThemeOverrides,
    assertValidCustomTheme,
} from "../src/lib/validation.ts"

describe("assertValidUrl", () => {
    it("accepts valid HTTPS URL", () => {
        assert.doesNotThrow(() => assertValidUrl("https://example.com"))
    })

    it("accepts valid HTTP URL", () => {
        assert.doesNotThrow(() => assertValidUrl("http://example.com"))
    })

    it("accepts empty string", () => {
        assert.doesNotThrow(() => assertValidUrl(""))
    })

    it("rejects javascript: URL", () => {
        assert.throws(
            () => assertValidUrl("javascript:alert(1)"),
            /URL must use http: or https: protocol/,
        )
    })

    it("rejects data: URL", () => {
        assert.throws(
            () => assertValidUrl("data:text/html,<script>alert(1)</script>"),
            /URL must use http: or https: protocol/,
        )
    })

    it("rejects invalid URL format", () => {
        assert.throws(
            () => assertValidUrl("not a url"),
            /Invalid URL/,
        )
    })
})

describe("assertValidEmail", () => {
    it("accepts valid email", () => {
        assert.doesNotThrow(() => assertValidEmail("user@example.com"))
    })

    it("accepts empty string", () => {
        assert.doesNotThrow(() => assertValidEmail(""))
    })

    it("rejects email without @", () => {
        assert.throws(
            () => assertValidEmail("userexample.com"),
            /Invalid email/,
        )
    })

    it("rejects email without domain", () => {
        assert.throws(
            () => assertValidEmail("user@"),
            /Invalid email/,
        )
    })
})

describe("assertValidFont", () => {
    it("accepts valid font name", () => {
        assert.doesNotThrow(() => assertValidFont("Inter"))
    })

    it("accepts empty string", () => {
        assert.doesNotThrow(() => assertValidFont(""))
    })

    it("rejects font with semicolon", () => {
        assert.throws(
            () => assertValidFont("Inter; color: red"),
            /unsafe characters/,
        )
    })

    it("rejects font with curly braces", () => {
        assert.throws(
            () => assertValidFont("Inter { color: red }"),
            /unsafe characters/,
        )
    })

    it("rejects font with url()", () => {
        assert.throws(
            () => assertValidFont("url(https://evil.com/font.css)"),
            /unsafe characters/,
        )
    })

    it("rejects font exceeding max length", () => {
        assert.throws(
            () => assertValidFont("x".repeat(129)),
            /exceeds/,
        )
    })
})

describe("assertValidCopyright", () => {
    it("accepts valid copyright", () => {
        assert.doesNotThrow(() => assertValidCopyright("John Doe"))
    })

    it("rejects empty string", () => {
        assert.throws(
            () => assertValidCopyright(""),
            /Copyright cannot be empty/,
        )
    })

    it("rejects HTML tags", () => {
        assert.throws(
            () => assertValidCopyright("<script>alert(1)</script>"),
            /HTML tags/,
        )
    })

    it("rejects copyright exceeding max length", () => {
        assert.throws(
            () => assertValidCopyright("x".repeat(257)),
            /exceeds/,
        )
    })
})

describe("assertValidYear", () => {
    it("accepts valid year", () => {
        assert.doesNotThrow(() => assertValidYear(2024))
    })

    it("accepts boundary years", () => {
        assert.doesNotThrow(() => assertValidYear(1900))
        assert.doesNotThrow(() => assertValidYear(2100))
    })

    it("rejects year below 1900", () => {
        assert.throws(
            () => assertValidYear(1899),
            /between 1900 and 2100/,
        )
    })

    it("rejects year above 2100", () => {
        assert.throws(
            () => assertValidYear(2101),
            /between 1900 and 2100/,
        )
    })

    it("rejects non-integer year", () => {
        assert.throws(
            () => assertValidYear(2024.5),
            /integer/,
        )
    })

    it("rejects NaN", () => {
        assert.throws(
            () => assertValidYear(NaN),
            /finite number/,
        )
    })

    it("rejects Infinity", () => {
        assert.throws(
            () => assertValidYear(Infinity),
            /finite number/,
        )
    })
})

describe("assertValidCustomName", () => {
    it("accepts valid name", () => {
        assert.doesNotThrow(() => assertValidCustomName("My License"))
    })

    it("rejects empty name", () => {
        assert.throws(
            () => assertValidCustomName(""),
            /cannot be empty/,
        )
    })

    it("rejects HTML tags", () => {
        assert.throws(
            () => assertValidCustomName("<script>alert(1)</script>"),
            /HTML tags/,
        )
    })

    it("rejects name exceeding max length", () => {
        assert.throws(
            () => assertValidCustomName("x".repeat(257)),
            /exceeds/,
        )
    })
})

describe("assertValidCustomText", () => {
    it("accepts valid text", () => {
        assert.doesNotThrow(() => assertValidCustomText("MIT License text"))
    })

    it("rejects empty text", () => {
        assert.throws(
            () => assertValidCustomText(""),
            /cannot be empty/,
        )
    })

    it("rejects text exceeding max length", () => {
        assert.throws(
            () => assertValidCustomText("x".repeat((50 * 1024) + 1)),
            /exceeds/,
        )
    })
})

describe("assertValidThemeOverrides", () => {
    const allowed = ["--lx-bg", "--lx-text"]

    it("accepts valid overrides", () => {
        assert.doesNotThrow(() => {
            assertValidThemeOverrides({ "--lx-bg": "#fff" }, allowed)
        })
    })

    it("rejects empty value", () => {
        assert.throws(
            () => assertValidThemeOverrides({ "--lx-bg": "" }, allowed),
            /Empty value for --lx-bg in themeOverrides/,
        )
    })

    it("rejects disallowed CSS variable", () => {
        assert.throws(
            () => assertValidThemeOverrides({ "--lx-evil": "red" }, allowed),
            /Disallowed CSS variable/,
        )
    })

    it("rejects value with semicolon", () => {
        assert.throws(
            () => assertValidThemeOverrides({ "--lx-bg": "red; color: blue" }, allowed),
            /Unsafe value/,
        )
    })

    it("rejects value with url()", () => {
        assert.throws(
            () => assertValidThemeOverrides({ "--lx-bg": "url(https://evil.com)" }, allowed),
            /Unsafe value/,
        )
    })
})

describe("assertValidCustomTheme", () => {
    it("accepts valid theme colors", () => {
        assert.doesNotThrow(() => {
            assertValidCustomTheme({
                bg: "#1a1a1a",
                text: "#e5e5e5",
                textMuted: "#a3a3a3",
                accent: "#60a5fa",
                border: "#404040",
            })
        })
    })

    it("accepts partial theme (only some keys)", () => {
        assert.doesNotThrow(() => {
            assertValidCustomTheme({ bg: "#000", text: "#fff" })
        })
    })

    it("rejects disallowed key", () => {
        assert.throws(
            () => assertValidCustomTheme({ bg: "#000", evil: "#fff" }),
            /Disallowed key in customTheme/,
        )
    })

    it("rejects value with semicolon", () => {
        assert.throws(
            () => assertValidCustomTheme({ bg: "#000; color: red" }),
            /contains unsafe characters/,
        )
    })

    it("rejects value with curly braces", () => {
        assert.throws(
            () => assertValidCustomTheme({ bg: "#000 { color: red }" }),
            /contains unsafe characters/,
        )
    })

    it("rejects value with url()", () => {
        assert.throws(
            () => assertValidCustomTheme({ bg: "url(https://evil.com)" }),
            /contains unsafe characters/,
        )
    })

    it("rejects value exceeding 64 chars", () => {
        assert.throws(
            () => assertValidCustomTheme({ bg: "x".repeat(65) }),
            /exceeds 64 characters/,
        )
    })

    it("accepts named CSS colors", () => {
        assert.doesNotThrow(() => {
            assertValidCustomTheme({ bg: "white", text: "black" })
        })
    })
})
