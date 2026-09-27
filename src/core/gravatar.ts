/**
 * Gravatar URL generation.
 *
 * Gravatar derives the avatar from a SHA-256 hash of the email, trimmed and
 * lowercased for consistency.
 *
 * @see {@link https://docs.gravatar.com/api/avatars/images/ | Gravatar API}
 * @module
 */

/**
 * Generates a Gravatar avatar URL for an email address.
 *
 * @param size        - Avatar size in pixels.
 * @param defaultType - Fallback avatar when the email has no Gravatar.
 *                      `"404"` makes Gravatar return an error instead of an image,
 *                      which the demo uses to detect missing profiles.
 */
export async function getGravatarUrl(
    email: string,
    size = 80,
    defaultType: "mp" | "identicon" | "monsterid" | "wavatar" | "retro" | "robohash" | "blank" | "404" = "mp",
): Promise<string> {
    const normalized = email.trim().toLowerCase()
    const data = new TextEncoder().encode(normalized)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultType}`
}
