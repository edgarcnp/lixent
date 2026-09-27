import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
    classifyParagraph,
    stripDuplicateTitle,
    toParagraphs,
    type Paragraph,
} from "../src/core/paragraphs.ts"

describe("toParagraphs", () => {
    it("splits on blank lines and collapses soft wraps", () => {
        assert.deepEqual(toParagraphs("a\nb\n\nc"), [
            { text: "a b", kind: "body" },
            { text: "c", kind: "body" },
        ])
    })

    it("returns an empty list for blank text", () => {
        assert.deepEqual(toParagraphs("   \n\n  "), [])
    })

    it("classifies headings while splitting", () => {
        assert.deepEqual(toParagraphs("TERMS AND CONDITIONS\n\nBody text."), [
            { text: "TERMS AND CONDITIONS", kind: "heading" },
            { text: "Body text.", kind: "body" },
        ])
    })
})

describe("classifyParagraph", () => {
    it("treats short all-caps paragraphs as headings", () => {
        assert.equal(classifyParagraph("NO WARRANTY"), "heading")
        assert.equal(classifyParagraph("END OF TERMS AND CONDITIONS"), "heading")
    })

    it("treats numbered clause titles as headings", () => {
        assert.equal(classifyParagraph("1. Definitions."), "heading")
        assert.equal(classifyParagraph("9. Accepting Warranty or Additional Liability."), "heading")
    })

    it("treats lone capitalized words as headings", () => {
        assert.equal(classifyParagraph("Preamble"), "heading")
    })

    it("keeps mixed-case and long numbered text as body", () => {
        assert.equal(classifyParagraph("MIT License"), "body")
        assert.equal(classifyParagraph("Permission is hereby granted, free of charge..."), "body")
        assert.equal(
            classifyParagraph(
                "1. Grant of Copyright License. Subject to the terms and conditions of this License, each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license.",
            ),
            "body",
        )
    })

    it("keeps long all-caps paragraphs as body", () => {
        assert.equal(
            classifyParagraph(
                "THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.",
            ),
            "body",
        )
    })
})

describe("stripDuplicateTitle", () => {
    it("removes a leading paragraph matching the license name", () => {
        const paragraphs: Paragraph[] = [
            { text: "MIT License", kind: "body" },
            { text: "Permission...", kind: "body" },
        ]
        assert.deepEqual(stripDuplicateTitle(paragraphs, "MIT License"), [
            { text: "Permission...", kind: "body" },
        ])
        assert.deepEqual(stripDuplicateTitle(paragraphs, "mit license"), [
            { text: "Permission...", kind: "body" },
        ])
    })

    it("keeps a title that adds information", () => {
        const paragraphs: Paragraph[] = [
            { text: "BSD 3-Clause License", kind: "body" },
            { text: "Redistribution...", kind: "body" },
        ]
        assert.deepEqual(
            stripDuplicateTitle(paragraphs, 'BSD 3-Clause "New" or "Revised" License'),
            paragraphs,
        )
    })

    it("handles empty input", () => {
        assert.deepEqual(stripDuplicateTitle([], "MIT License"), [])
    })
})
