import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { buildPage, toParagraphs } from "../src/core/page/build.ts"
import type { LixentConfig } from "../src/core/config/types.ts"
import type { SpdxClient } from "../src/core/license/resolve.ts"

function customConfig(overrides: Partial<LixentConfig> = {}): LixentConfig {
    return {
        copyright: "Jane Doe",
        license: "custom",
        gravatar: false,
        theme: { preset: "minimal" },
        customLicense: { name: "Test License", text: "First paragraph.\n\nSecond paragraph\nwith a soft wrap." },
        ...overrides,
    }
}

function fixedNow(): Date {
    return new Date(2026, 0, 15, 12, 0, 0)
}

function spdxClient(name: string, text: string): SpdxClient {
    return {
        nameFor: (_id: string) => Promise.resolve(name),
        textFor: (_id: string) => Promise.resolve(text),
    }
}

describe("buildPage", () => {
    it("builds title, year, and paragraphs", async () => {
        const page = await buildPage(customConfig(), { now: fixedNow })
        assert.equal(page.title, "Test License")
        assert.equal(page.year, "2026")
        assert.deepEqual(page.paragraphs, ["First paragraph.", "Second paragraph with a soft wrap."])
    })

    it("prefers an explicit year and supports year ranges", async () => {
        const single = await buildPage(customConfig({ year: 2020 }), { now: fixedNow })
        assert.equal(single.year, "2020")
        const range = await buildPage(customConfig({ yearRange: { start: 2020, end: 2024 } }), { now: fixedNow })
        assert.equal(range.year, "2020–2024")
    })

    it("renders placeholders with identity values", async () => {
        const page = await buildPage(customConfig({
            url: "https://jane.dev",
            email: "jane@example.com",
            customLicense: { name: "Mine", text: "{{year}} {{name}} ({{url}}, {{email}})" },
        }), { now: fixedNow })
        assert.deepEqual(page.paragraphs, ["2026 Jane Doe (https://jane.dev, jane@example.com)"])
    })

    it("includes identity links and resolves gravatar", async () => {
        const page = await buildPage(customConfig({ gravatar: true, email: "jane@example.com" }), {
            now: fixedNow,
            gravatarUrl: (email, size) => Promise.resolve(`https://gravatar.test/${email}/${size}`),
        })
        assert.equal(page.identity.url, undefined)
        assert.equal(page.identity.email, "jane@example.com")
        assert.equal(page.identity.gravatarUrl, "https://gravatar.test/jane@example.com/64")
    })

    it("omits gravatar without an email", async () => {
        const page = await buildPage(customConfig({ gravatar: true }), { now: fixedNow })
        assert.equal(page.identity.gravatarUrl, undefined)
    })

    it("resolves SPDX licenses through the injected client", async () => {
        const page = await buildPage({
            copyright: "Jane Doe",
            license: "MIT",
            gravatar: false,
            theme: { preset: "minimal" },
        }, { now: fixedNow, spdx: spdxClient("MIT License", "MIT text") })
        assert.equal(page.title, "MIT License")
        assert.deepEqual(page.paragraphs, ["MIT text"])
    })

    it("resolves head style and font assets", async () => {
        const page = await buildPage(customConfig({
            theme: { preset: "github-dark", font: "Inter", fontWeight: "700" },
        }), { now: fixedNow })
        assert.match(page.head.style, /--lx-bg:/)
        assert.match(page.head.style, /--lx-font-weight: 700/)
        assert.equal(page.head.fontHref, "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap")
        assert.equal(page.head.themeHref, null)
    })

    it("is deterministic for the same clock", async () => {
        const first = await buildPage(customConfig(), { now: fixedNow })
        const second = await buildPage(customConfig(), { now: fixedNow })
        assert.deepEqual(first, second)
    })
})

describe("toParagraphs", () => {
    it("splits on blank lines and collapses soft wraps", () => {
        assert.deepEqual(toParagraphs("a\nb\n\nc"), ["a b", "c"])
    })

    it("returns an empty list for blank text", () => {
        assert.deepEqual(toParagraphs("   \n\n  "), [])
    })
})
