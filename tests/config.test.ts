import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs"
import { join } from "node:path"
import { loadConfig } from "../src/lib/config/index.ts"

const TMP_DIR = join(import.meta.dirname, "../tmp-config-test")

function setup() {
    mkdirSync(TMP_DIR, { recursive: true })
}

function teardown() {
    if (existsSync(TMP_DIR)) {
        rmSync(TMP_DIR, { recursive: true })
    }
}

beforeEach(() => setup())
afterEach(() => teardown())

describe("loadConfig", () => {
    it("loads from lixent.config.json", () => {
        const config = {
            copyright: "Jane Doe",
            license: "MIT",
            theme: "github",
        }
        writeFileSync(join(TMP_DIR, "lixent.config.json"), JSON.stringify(config))
        const loaded = loadConfig(TMP_DIR)
        assert.equal(loaded.copyright, "Jane Doe")
        assert.equal(loaded.license, "MIT")
        assert.equal(loaded.theme, "github")
    })

    it("falls back to package.json lixent field", () => {
        const pkg = {
            name: "my-project",
            lixent: {
                copyright: "From Package",
                license: "ISC",
                theme: "terminal",
            },
        }
        writeFileSync(join(TMP_DIR, "package.json"), JSON.stringify(pkg))
        const loaded = loadConfig(TMP_DIR)
        assert.equal(loaded.copyright, "From Package")
        assert.equal(loaded.license, "ISC")
        assert.equal(loaded.theme, "terminal")
    })

    it("uses package name as copyright fallback", () => {
        const pkg = {
            name: "awesome-lib",
            lixent: {
                license: "MIT",
            },
        }
        writeFileSync(join(TMP_DIR, "package.json"), JSON.stringify(pkg))
        const loaded = loadConfig(TMP_DIR)
        assert.equal(loaded.copyright, "awesome-lib")
    })

    it("returns defaults when no config found", () => {
        const loaded = loadConfig(TMP_DIR)
        assert.equal(loaded.copyright, "Unknown")
        assert.equal(loaded.license, "MIT")
        assert.equal(loaded.theme, "minimal")
    })

    it("prefers lixent.config.json over package.json", () => {
        const config = { copyright: "From Config", license: "BSD-2-Clause", theme: "serif" }
        const pkg = { name: "pkg", lixent: { copyright: "From Package" } }
        writeFileSync(join(TMP_DIR, "lixent.config.json"), JSON.stringify(config))
        writeFileSync(join(TMP_DIR, "package.json"), JSON.stringify(pkg))
        const loaded = loadConfig(TMP_DIR)
        assert.equal(loaded.copyright, "From Config")
    })

    it("handles invalid JSON gracefully", () => {
        writeFileSync(join(TMP_DIR, "lixent.config.json"), "{invalid json")
        assert.throws(() => loadConfig(TMP_DIR), SyntaxError)
    })

    it("loads custom license config", () => {
        const config = {
            copyright: "Test",
            license: "custom",
            customLicense: {
                name: "My Custom License",
                text: "Custom text for {{name}}",
            },
            theme: "minimal",
        }
        writeFileSync(join(TMP_DIR, "lixent.config.json"), JSON.stringify(config))
        const loaded = loadConfig(TMP_DIR)
        assert.equal(loaded.license, "custom")
        assert.ok(loaded.customLicense)
        assert.equal(loaded.customLicense.name, "My Custom License")
    })
})

describe("loadConfig edge cases", () => {
    it("handles package.json without lixent field", () => {
        const pkg = { name: "no-lixent" }
        writeFileSync(join(TMP_DIR, "package.json"), JSON.stringify(pkg))
        const loaded = loadConfig(TMP_DIR)
        assert.equal(loaded.copyright, "Unknown")
    })

    it("handles empty lixent object in package.json", () => {
        const pkg = { name: "empty-lixent", lixent: {} }
        writeFileSync(join(TMP_DIR, "package.json"), JSON.stringify(pkg))
        const loaded = loadConfig(TMP_DIR)
        assert.equal(loaded.copyright, "empty-lixent")
        assert.equal(loaded.license, "MIT")
        assert.equal(loaded.theme, "minimal")
    })

    it("throws when copyright and package name are both missing", () => {
        const pkg = { lixent: { license: "MIT" } }
        writeFileSync(join(TMP_DIR, "package.json"), JSON.stringify(pkg))
        assert.throws(
            () => loadConfig(TMP_DIR),
            /copyright is required/,
        )
    })
})

describe("loadConfig custom theme", () => {
    it("loads custom theme from inline config", () => {
        const config = {
            copyright: "Test",
            license: "MIT",
            theme: "custom",
            customTheme: {
                bg: "#1a1a1a",
                text: "#e5e5e5",
                textMuted: "#a3a3a3",
                accent: "#60a5fa",
                border: "#404040",
            },
        }
        writeFileSync(join(TMP_DIR, "lixent.config.json"), JSON.stringify(config))
        const loaded = loadConfig(TMP_DIR)
        assert.equal(loaded.theme, "custom")
        assert.ok(loaded.customTheme)
        assert.equal(loaded.customTheme.bg, "#1a1a1a")
    })

    it("throws when theme is custom but customTheme is missing", () => {
        const config = {
            copyright: "Test",
            license: "MIT",
            theme: "custom",
        }
        writeFileSync(join(TMP_DIR, "lixent.config.json"), JSON.stringify(config))
        assert.throws(
            () => loadConfig(TMP_DIR),
            /Theme is "custom" but customTheme is not set/,
        )
    })

    it("throws for disallowed key in customTheme", () => {
        const config = {
            copyright: "Test",
            license: "MIT",
            theme: "custom",
            customTheme: { bg: "#000", evil: "#fff" },
        }
        writeFileSync(join(TMP_DIR, "lixent.config.json"), JSON.stringify(config))
        assert.throws(
            () => loadConfig(TMP_DIR),
            /Disallowed key in customTheme/,
        )
    })
})

describe("loadConfig custom license from file", () => {
    it("loads custom license from licenseFile", () => {
        const licenseText = "Custom license for {{name}}"
        writeFileSync(join(TMP_DIR, "CUSTOM-LICENSE"), licenseText)
        const config = {
            copyright: "Test",
            license: "custom",
            licenseFile: "./CUSTOM-LICENSE",
            theme: "minimal",
        }
        writeFileSync(join(TMP_DIR, "lixent.config.json"), JSON.stringify(config))
        const loaded = loadConfig(TMP_DIR)
        assert.equal(loaded.license, "custom")
        assert.equal(loaded.licenseFile, "./CUSTOM-LICENSE")
    })

    it("throws when license is custom but no text or file", () => {
        const config = {
            copyright: "Test",
            license: "custom",
            theme: "minimal",
        }
        writeFileSync(join(TMP_DIR, "lixent.config.json"), JSON.stringify(config))
        assert.throws(
            () => loadConfig(TMP_DIR),
            /neither customLicense\.text nor licenseFile is set/,
        )
    })
})

describe("loadConfig year and yearRange", () => {
    it("accepts year only", () => {
        const config = {
            copyright: "Test",
            license: "MIT",
            theme: "minimal",
            year: 2025,
        }
        writeFileSync(join(TMP_DIR, "lixent.config.json"), JSON.stringify(config))
        const loaded = loadConfig(TMP_DIR)
        assert.equal(loaded.year, 2025)
    })

    it("accepts yearRange only", () => {
        const config = {
            copyright: "Test",
            license: "MIT",
            theme: "minimal",
            yearRange: { start: 2020, end: 2025 },
        }
        writeFileSync(join(TMP_DIR, "lixent.config.json"), JSON.stringify(config))
        const loaded = loadConfig(TMP_DIR)
        assert.ok(loaded.yearRange)
        assert.equal(loaded.yearRange.start, 2020)
        assert.equal(loaded.yearRange.end, 2025)
    })

    it("throws when both year and yearRange are set", () => {
        const config = {
            copyright: "Test",
            license: "MIT",
            theme: "minimal",
            year: 2025,
            yearRange: { start: 2020, end: 2025 },
        }
        writeFileSync(join(TMP_DIR, "lixent.config.json"), JSON.stringify(config))
        assert.throws(
            () => loadConfig(TMP_DIR),
            /Both `year` and `yearRange` are set/,
        )
    })

    it("throws when yearRange.start > yearRange.end", () => {
        const config = {
            copyright: "Test",
            license: "MIT",
            theme: "minimal",
            yearRange: { start: 2026, end: 2020 },
        }
        writeFileSync(join(TMP_DIR, "lixent.config.json"), JSON.stringify(config))
        assert.throws(
            () => loadConfig(TMP_DIR),
            /yearRange\.start \(2026\) must not exceed yearRange\.end \(2020\)/,
        )
    })

    it("throws when year is a non-numeric string", () => {
        const config = {
            copyright: "Test",
            license: "MIT",
            theme: "minimal",
            year: "not-a-number",
        }
        writeFileSync(join(TMP_DIR, "lixent.config.json"), JSON.stringify(config))
        assert.throws(
            () => loadConfig(TMP_DIR),
            /year must be a number, got "not-a-number"/,
        )
    })

    it("throws when yearRange.start is a non-numeric string", () => {
        const config = {
            copyright: "Test",
            license: "MIT",
            theme: "minimal",
            yearRange: { start: "abc", end: 2025 },
        }
        writeFileSync(join(TMP_DIR, "lixent.config.json"), JSON.stringify(config))
        assert.throws(
            () => loadConfig(TMP_DIR),
            /yearRange\.start must be a number, got "abc"/,
        )
    })

    it("throws when yearRange.end is a non-numeric string", () => {
        const config = {
            copyright: "Test",
            license: "MIT",
            theme: "minimal",
            yearRange: { start: 2020, end: "xyz" },
        }
        writeFileSync(join(TMP_DIR, "lixent.config.json"), JSON.stringify(config))
        assert.throws(
            () => loadConfig(TMP_DIR),
            /yearRange\.end must be a number, got "xyz"/,
        )
    })
})
