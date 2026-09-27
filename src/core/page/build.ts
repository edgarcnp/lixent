/**
 * Page model construction.
 *
 * The whole pipeline — year, license, text rendering, identity, and style —
 * lives here and returns one resolved {@link PageModel}. Astro only renders
 * the model; all time and I/O are injectable for deterministic tests.
 *
 * @module
 */

import type { LixentConfig } from "../config/types.ts"
import { getGravatarUrl } from "../gravatar.ts"
import { renderLicenseText } from "../license/render.ts"
import { resolveLicense, type ResolveLicenseOptions } from "../license/resolve.ts"
import { resolveStyle } from "../theme/style.ts"
import { formatYear, formatYearRange } from "../year.ts"

/** Copyright identity shown in the page header. */
export interface PageIdentity {
    name: string
    url?: string
    email?: string
    gravatarUrl?: string
}

/** Head assets resolved for the page. */
export interface PageHead {
    /** Custom property declarations for the `<html>` style attribute. */
    style: string
    /** Google Fonts stylesheet URL. */
    fontHref: string | null
    /** External theme stylesheet path. */
    themeHref: string | null
}

/** Everything the license page needs to render. */
export interface PageModel {
    title: string
    year: string
    identity: PageIdentity
    paragraphs: string[]
    head: PageHead
}

/** Injectable dependencies; all default to real implementations. */
export interface BuildPageDeps extends ResolveLicenseOptions {
    /** Clock used for the default year. */
    now?: () => Date
    /** Gravatar URL builder. */
    gravatarUrl?: (email: string, size: number) => Promise<string>
}

/** Builds the complete page model from a validated configuration. */
export async function buildPage(config: LixentConfig, deps: BuildPageDeps = {}): Promise<PageModel> {
    const year = resolveYear(config, deps.now)
    const license = await resolveLicense(config, deps)
    const text = renderLicenseText(license.text, {
        year,
        name: config.copyright,
        url: config.url,
        email: config.email,
    })

    const identity: PageIdentity = { name: config.copyright }
    if (config.url !== undefined) {
        identity.url = config.url
    }
    if (config.email !== undefined) {
        identity.email = config.email
    }
    if (config.gravatar && config.email !== undefined) {
        const buildGravatarUrl = deps.gravatarUrl ?? getGravatarUrl
        identity.gravatarUrl = await buildGravatarUrl(config.email, 64)
    }

    const style = resolveStyle(config)

    return {
        title: license.name,
        year,
        identity,
        paragraphs: toParagraphs(text),
        head: {
            style: style.style,
            fontHref: style.fontHref,
            themeHref: style.themeHref,
        },
    }
}

/** Splits license text into paragraphs, collapsing single newlines. */
export function toParagraphs(text: string): string[] {
    return text
        .split(/\n\n+/)
        .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
        .filter((paragraph) => paragraph.length > 0)
}

function resolveYear(config: LixentConfig, now?: () => Date): string {
    if (config.year !== undefined) {
        return formatYear(config.year)
    }
    if (config.yearRange !== undefined) {
        return formatYearRange(config.yearRange.start, config.yearRange.end)
    }
    const clock = now ?? (() => new Date())
    return formatYear(clock().getFullYear())
}
