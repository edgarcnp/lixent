import { afterEach, beforeEach, describe, it } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { ConfigError } from "../src/core/diagnostics.ts"
import { loadConfig } from "../src/core/config/loader.ts"

const TMP_DIR = join(import.meta.dirname, "../tmp-config-test")

function writeConfig(config: unknown): void {
    writeFileSync(join(TMP_DIR, "lixent.config.json"), JSON.stringify(config, null, 4))
}

function baseConfig(): Record<string, unknown> {
    return { copyright: "Jane Doe", license: "MIT" }
}

function configErrorCodes(error: unknown): string[] {
    assert.ok(error instanceof ConfigError)
    return error.diagnostics.map((item) => item.code)
}

beforeEach(() => {
    mkdirSync(TMP_DIR, { recursive: true })
})

afterEach(() => {
    if (existsSync(TMP_DIR)) {
        rmSync(TMP_DIR, { recursive: true })
    }
})

describe("loadConfig", () => {
    it("loads a minimal config with defaults", () => {
        writeConfig(baseConfig())
        const config = loadConfig({ root: TMP_DIR })
        assert.equal(config.copyright, "Jane Doe")
        assert.equal(config.license, "MIT")
        assert.equal(config.gravatar, false)
        assert.equal(config.theme.preset, "minimal")
    })

    it("parses the full theme section and coerces a string year", () => {
        writeConfig({
            ...baseConfig(),
            url: "https://jane.dev",
            email: "jane@example.com",
            gravatar: true,
            year: "2024",
            basePath: "/license",
            theme: {
                preset: "github-dark",
                colors: { bg: "#101010", accent: "#60a5fa" },
                font: "Inter",
                fontSize: "1.125rem",
                fontWeight: "700",
                lineHeight: "1.6",
                letterSpacing: "0.02em",
            },
        })
        const config = loadConfig({ root: TMP_DIR })
        assert.equal(config.year, 2024)
        assert.equal(config.basePath, "/license")
        assert.equal(config.theme.preset, "github-dark")
        const colors = config.theme.colors
        assert.ok(colors !== undefined)
        assert.equal(colors.bg, "#101010")
        assert.equal(colors.accent, "#60a5fa")
        assert.equal(config.theme.font, "Inter")
        assert.equal(config.theme.fontWeight, "700")
    })

    it("accepts the $schema key", () => {
        writeConfig({ $schema: "./lixent.schema.json", ...baseConfig() })
        const config = loadConfig({ root: TMP_DIR })
        assert.equal(config.license, "MIT")
    })

    it("accepts a path theme preset", () => {
        writeConfig({ ...baseConfig(), theme: { preset: "/my-theme.css" } })
        const config = loadConfig({ root: TMP_DIR })
        assert.equal(config.theme.preset, "/my-theme.css")
    })

    it("supports an explicit configPath", () => {
        writeFileSync(join(TMP_DIR, "other.json"), JSON.stringify({ copyright: "Other", license: "MIT" }))
        const config = loadConfig({ configPath: join(TMP_DIR, "other.json") })
        assert.equal(config.copyright, "Other")
    })

    it("throws CONFIG_MISSING when no config file exists", () => {
        assert.throws(() => loadConfig({ root: TMP_DIR }), (error: unknown) => {
            return configErrorCodes(error).includes("CONFIG_MISSING")
        })
    })

    it("throws CONFIG_PARSE for invalid JSON", () => {
        writeFileSync(join(TMP_DIR, "lixent.config.json"), "{invalid json")
        assert.throws(() => loadConfig({ root: TMP_DIR }), (error: unknown) => {
            return configErrorCodes(error).includes("CONFIG_PARSE")
        })
    })

    it("throws CONFIG_SHAPE for a non-object root", () => {
        writeConfig([1, 2, 3])
        assert.throws(() => loadConfig({ root: TMP_DIR }), (error: unknown) => {
            return configErrorCodes(error).includes("CONFIG_SHAPE")
        })
    })

    it("requires copyright and license", () => {
        writeConfig({})
        assert.throws(() => loadConfig({ root: TMP_DIR }), (error: unknown) => {
            const codes = configErrorCodes(error)
            assert.equal(codes.filter((code) => code === "MISSING_FIELD").length, 2)
            return true
        })
    })

    it("reports every diagnostic at once", () => {
        writeConfig({
            copyright: "",
            license: "MIT",
            url: "javascript:alert(1)",
            year: 1800,
            theme: { preset: "does-not-exist" },
            bogus: true,
        })
        assert.throws(() => loadConfig({ root: TMP_DIR }), (error: unknown) => {
            const codes = configErrorCodes(error).sort()
            assert.deepEqual(codes, ["EMPTY_FIELD", "INVALID_PROTOCOL", "INVALID_VALUE", "OUT_OF_RANGE", "UNKNOWN_KEY"])
            return true
        })
    })
})

describe("validation diagnostics", () => {
    const cases: [string, Record<string, unknown>, string][] = [
        ["rejects HTML in copyright", { ...baseConfig(), copyright: "<script>x</script>" }, "HTML_TAGS"],
        ["rejects a too-long copyright", { ...baseConfig(), copyright: "x".repeat(257) }, "TOO_LONG"],
        ["rejects a malformed url", { ...baseConfig(), url: "not a url" }, "INVALID_FORMAT"],
        ["rejects a non-http url", { ...baseConfig(), url: "javascript:alert(1)" }, "INVALID_PROTOCOL"],
        ["rejects a malformed email", { ...baseConfig(), email: "nope" }, "INVALID_FORMAT"],
        ["rejects gravatar without email", { ...baseConfig(), gravatar: true }, "INVALID_VALUE"],
        ["rejects unknown top-level keys", { ...baseConfig(), nope: 1 }, "UNKNOWN_KEY"],
        ["rejects unknown theme keys", { ...baseConfig(), theme: { nope: 1 } }, "UNKNOWN_KEY"],
        ["rejects unknown color keys", { ...baseConfig(), theme: { colors: { nope: "#fff" } } }, "UNKNOWN_KEY"],
        ["rejects unsafe color values", { ...baseConfig(), theme: { colors: { bg: "url(https://evil)" } } }, "UNSAFE_VALUE"],
        ["rejects a too-long color value", { ...baseConfig(), theme: { colors: { bg: "#".repeat(65) } } }, "TOO_LONG"],
        ["rejects an unknown theme preset", { ...baseConfig(), theme: { preset: "does-not-exist" } }, "INVALID_VALUE"],
        ["rejects invalid font characters", { ...baseConfig(), theme: { font: "Inter;color:red" } }, "UNSAFE_VALUE"],
        ["rejects a non-integer year", { ...baseConfig(), year: 2024.5 }, "INVALID_TYPE"],
        ["rejects an out-of-range year", { ...baseConfig(), year: 1800 }, "OUT_OF_RANGE"],
        ["rejects a non-numeric year string", { ...baseConfig(), year: "abc" }, "INVALID_TYPE"],
        [
            "rejects year and yearRange together",
            { ...baseConfig(), year: 2024, yearRange: { start: 2020, end: 2024 } },
            "MUTUALLY_EXCLUSIVE",
        ],
        ["rejects a reversed year range", { ...baseConfig(), yearRange: { start: 2030, end: 2020 } }, "INVALID_VALUE"],
        ["rejects custom license without text or file", { ...baseConfig(), license: "custom" }, "MISSING_FIELD"],
        [
            "rejects both custom text and file",
            { ...baseConfig(), license: "custom", customLicense: { text: "x" }, licenseFile: "LICENSE" },
            "MUTUALLY_EXCLUSIVE",
        ],
        ["rejects customLicense with an SPDX license", { ...baseConfig(), customLicense: { text: "x" } }, "INVALID_VALUE"],
        ["rejects licenseFile with an SPDX license", { ...baseConfig(), licenseFile: "LICENSE" }, "INVALID_VALUE"],
        [
            "rejects absolute licenseFile paths",
            { ...baseConfig(), license: "custom", licenseFile: "/etc/passwd" },
            "INVALID_FORMAT",
        ],
        [
            "rejects parent-directory licenseFile paths",
            { ...baseConfig(), license: "custom", licenseFile: "../LICENSE" },
            "INVALID_FORMAT",
        ],
        ["rejects an invalid basePath", { ...baseConfig(), basePath: "license" }, "INVALID_FORMAT"],
        ["rejects a trailing-slash basePath", { ...baseConfig(), basePath: "/license/" }, "INVALID_FORMAT"],
        ["rejects an invalid SPDX license shape", { copyright: "Jane", license: "not a license" }, "INVALID_VALUE"],
        ["rejects a non-object theme", { ...baseConfig(), theme: "minimal" }, "INVALID_TYPE"],
    ]

    for (const [name, config, expectedCode] of cases) {
        it(name, () => {
            writeConfig(config)
            assert.throws(() => loadConfig({ root: TMP_DIR }), (error: unknown) => {
                return configErrorCodes(error).includes(expectedCode)
            })
        })
    }
})
