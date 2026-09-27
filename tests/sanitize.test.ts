import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { hasCssDangerous, hasCssUrl, hasHtmlTags, stripCssUrl } from "../src/core/sanitize.ts"

describe("hasHtmlTags", () => {
    it("detects HTML-like tags", () => {
        assert.equal(hasHtmlTags("<script>alert(1)</script>"), true)
        assert.equal(hasHtmlTags("</div>"), true)
    })

    it("allows plain text and comparisons", () => {
        assert.equal(hasHtmlTags("John Doe"), false)
        assert.equal(hasHtmlTags("A < B"), false)
    })
})

describe("hasCssUrl", () => {
    it("detects url() calls", () => {
        assert.equal(hasCssUrl("url(https://evil.example)"), true)
        assert.equal(hasCssUrl("URL (x)"), true)
    })

    it("allows plain values", () => {
        assert.equal(hasCssUrl("#fff"), false)
        assert.equal(hasCssUrl("1.125rem"), false)
    })
})

describe("hasCssDangerous", () => {
    it("detects structural characters and url()", () => {
        assert.equal(hasCssDangerous("#fff; color: red"), true)
        assert.equal(hasCssDangerous("{ color: red }"), true)
        assert.equal(hasCssDangerous("url(https://evil.example)"), true)
    })

    it("allows safe values", () => {
        assert.equal(hasCssDangerous("#60a5fa"), false)
        assert.equal(hasCssDangerous("clamp(1rem, 2vw, 1.5rem)"), false)
    })
})

describe("stripCssUrl", () => {
    it("removes url() syntax and structural characters", () => {
        assert.equal(stripCssUrl("url(https://evil.example)"), "https://evil.example)")
        assert.equal(stripCssUrl("#fff; color: red"), "#fff color: red")
        assert.equal(stripCssUrl("{ color: red }"), " color: red ")
    })

    it("leaves safe values untouched", () => {
        assert.equal(stripCssUrl("#60a5fa"), "#60a5fa")
    })
})
