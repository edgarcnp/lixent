/**
 * Paragraph splitting for license text.
 *
 * Kept separate from the page builder so browser code (the demo preview) can
 * import it without pulling in the server-side license resolver.
 *
 * @module
 */

/** Splits license text into paragraphs, collapsing single newlines. */
export function toParagraphs(text: string): string[] {
    return text
        .split(/\n\n+/)
        .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
        .filter((paragraph) => paragraph.length > 0)
}
