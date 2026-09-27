/**
 * Paragraph splitting and classification for license text.
 *
 * Pure and browser-safe: the demo preview imports this to render the same
 * paragraph structure the real page uses.
 *
 * @module
 */

/** A paragraph is either body text or a section heading. */
export type ParagraphKind = "body" | "heading"

export interface Paragraph {
    text: string
    kind: ParagraphKind
}

/** Splits license text into classified paragraphs, collapsing single newlines. */
export function toParagraphs(text: string): Paragraph[] {
    return text
        .split(/\n\n+/)
        .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
        .filter((paragraph) => paragraph.length > 0)
        .map((paragraph) => ({ text: paragraph, kind: classifyParagraph(paragraph) }))
}

/**
 * Classifies a paragraph as a section heading when it is short and either
 * ALL CAPS or a numbered clause title (e.g. `"1. Definitions."`).
 *
 * Classification is presentation-only; the text is never altered.
 */
export function classifyParagraph(text: string): ParagraphKind {
    const letters = text.replace(/[^A-Za-z]/g, "")
    if (letters.length >= 4 && text.length <= 100 && letters === letters.toUpperCase()) {
        return "heading"
    }
    if (text.length <= 20 && /^[A-Z][a-z]+$/.test(text)) {
        return "heading"
    }
    if (text.length <= 90 && /^\d+\.\s+[^.]*\.?$/.test(text)) {
        return "heading"
    }
    return "body"
}

/**
 * Drops a leading paragraph that repeats the license name, which would
 * otherwise appear twice (once as the page title).
 *
 * Only exact matches after normalization are removed; anything that adds
 * information (a version line, a URL) is kept.
 */
export function stripDuplicateTitle(paragraphs: Paragraph[], title: string): Paragraph[] {
    if (paragraphs.length === 0) {
        return paragraphs
    }
    const first = paragraphs[0]
    if (normalizeForComparison(first.text) !== normalizeForComparison(title)) {
        return paragraphs
    }
    return paragraphs.slice(1)
}

function normalizeForComparison(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "")
}
