import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { resolve } from "node:path"
import {
    assertTrustedSource,
    assertValidPath,
    assertValidLicenseId,
    assertValidText,
    convertPlaceholders,
    TRUSTED_SPDX_BASE,
    OUTPUT_DIR,
} from "../src/lib/validation.ts"

describe("assertTrustedSource", () => {
    it("accepts valid SPDX URL", () => {
        assert.doesNotThrow(() => {
            assertTrustedSource(`${TRUSTED_SPDX_BASE}/MIT.txt`)
        })
    })

    it("rejects untrusted URL", () => {
        assert.throws(
            () => assertTrustedSource("https://evil.com/license.txt"),
            /Untrusted source/,
        )
    })

    it("rejects HTTP URL", () => {
        assert.throws(
            () => assertTrustedSource("http://raw.githubusercontent.com/spdx/license-list-data/main/text/MIT.txt"),
            /Untrusted source/,
        )
    })

    it("rejects empty string", () => {
        assert.throws(
            () => assertTrustedSource(""),
            /Untrusted source/,
        )
    })
})

describe("assertValidPath", () => {
    it("accepts path within OUTPUT_DIR", () => {
        const validPath = resolve(OUTPUT_DIR, "MIT.json")
        assert.doesNotThrow(() => {
            assertValidPath(validPath)
        })
    })

    it("rejects path traversal with ..", () => {
        assert.throws(
            () => assertValidPath("/tmp/../etc/passwd"),
            /Path traversal/,
        )
    })

    it("rejects absolute path outside OUTPUT_DIR", () => {
        assert.throws(
            () => assertValidPath("/tmp/malicious.json"),
            /Path traversal/,
        )
    })

    it("rejects homedir path", () => {
        assert.throws(
            () => assertValidPath("/home/user/file.json"),
            /Path traversal/,
        )
    })
})

describe("assertValidLicenseId", () => {
    it("accepts valid SPDX IDs", () => {
        assert.doesNotThrow(() => assertValidLicenseId("MIT"))
        assert.doesNotThrow(() => assertValidLicenseId("Apache-2.0"))
        assert.doesNotThrow(() => assertValidLicenseId("BSD-2-Clause"))
        assert.doesNotThrow(() => assertValidLicenseId("GPL-3.0-only"))
        assert.doesNotThrow(() => assertValidLicenseId("0BSD"))
        assert.doesNotThrow(() => assertValidLicenseId("CC0-1.0"))
        assert.doesNotThrow(() => assertValidLicenseId("LGPL-2.1+"))
    })

    it("rejects ID with special characters", () => {
        assert.throws(
            () => assertValidLicenseId("MIT; rm -rf /"),
            /Invalid license ID format/,
        )
        assert.throws(
            () => assertValidLicenseId("MIT`whoami`"),
            /Invalid license ID format/,
        )
        assert.throws(
            () => assertValidLicenseId("MIT|cat /etc/passwd"),
            /Invalid license ID format/,
        )
    })

    it("rejects empty string", () => {
        assert.throws(
            () => assertValidLicenseId(""),
            /Invalid license ID format/,
        )
    })

    it("rejects spaces", () => {
        assert.throws(
            () => assertValidLicenseId("MIT License"),
            /Invalid license ID format/,
        )
    })
})

describe("assertValidText", () => {
    it("accepts valid license text", () => {
        assert.doesNotThrow(() => {
            assertValidText("MIT License\nCopyright (c) 2024", "MIT")
        })
    })

    it("rejects empty text", () => {
        assert.throws(
            () => assertValidText("", "MIT"),
            /Empty license text/,
        )
    })

    it("rejects oversized text", () => {
        const oversized = "x".repeat((50 * 1024) + 1)
        assert.throws(
            () => assertValidText(oversized, "MIT"),
            /exceeds/,
        )
    })

    it("accepts text at exact limit", () => {
        const atLimit = "x".repeat(50 * 1024)
        assert.doesNotThrow(() => {
            assertValidText(atLimit, "MIT")
        })
    })
})

describe("convertPlaceholders", () => {
    it("converts <year> placeholder", () => {
        assert.equal(convertPlaceholders("Copyright <year>"), "Copyright {{year}}")
    })

    it("converts <copyright holders> placeholder", () => {
        assert.equal(convertPlaceholders("<copyright holders>"), "{{name}}")
    })

    it("converts <name of copyright holder> placeholder", () => {
        assert.equal(convertPlaceholders("<name of copyright holder>"), "{{name}}")
    })

    it("converts [year] placeholder", () => {
        assert.equal(convertPlaceholders("[year]"), "{{year}}")
    })

    it("converts [name of copyright holder] placeholder", () => {
        assert.equal(convertPlaceholders("[name of copyright holder]"), "{{name}}")
    })

    it("converts [fullname] placeholder", () => {
        assert.equal(convertPlaceholders("[fullname]"), "{{name}}")
    })

    it("converts multiple placeholders", () => {
        const input = "Copyright [year] [fullname]"
        const expected = "Copyright {{year}} {{name}}"
        assert.equal(convertPlaceholders(input), expected)
    })

    it("leaves already converted placeholders unchanged", () => {
        assert.equal(convertPlaceholders("{{year}} {{name}}"), "{{year}} {{name}}")
    })
})
