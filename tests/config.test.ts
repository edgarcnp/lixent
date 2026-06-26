import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs"
import { join } from "node:path"
import { loadConfig } from "../src/lib/config.ts"

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
            theme: "github-dark",
        }
        writeFileSync(join(TMP_DIR, "lixent.config.json"), JSON.stringify(config))
        const loaded = loadConfig(TMP_DIR)
        assert.equal(loaded.copyright, "Jane Doe")
        assert.equal(loaded.license, "MIT")
        assert.equal(loaded.theme, "github-dark")
    })

    it("falls back to package.json lixent field", () => {
        const pkg = {
            name: "my-project",
            lixent: {
                copyright: "From Package",
                license: "ISC",
                theme: "terminal-dark",
            },
        }
        writeFileSync(join(TMP_DIR, "package.json"), JSON.stringify(pkg))
        const loaded = loadConfig(TMP_DIR)
        assert.equal(loaded.copyright, "From Package")
        assert.equal(loaded.license, "ISC")
        assert.equal(loaded.theme, "terminal-dark")
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
        assert.equal(loaded.theme, "minimal-dark")
    })

    it("prefers lixent.config.json over package.json", () => {
        const config = { copyright: "From Config", license: "BSD-2-Clause", theme: "dracula-dark" }
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
            theme: "minimal-dark",
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
        assert.equal(loaded.theme, "minimal-dark")
    })
})
