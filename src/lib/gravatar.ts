/**
 * Gravatar URL generation.
 *
 * Gravatar determines the avatar from a SHA-256 hash of the user's email.
 * The email is trimmed and lowercased before hashing to ensure consistency.
 *
 * @see {@link https://docs.gravatar.com/api/avatars/images/ | Gravatar API}
 * @module
 */

/**
 * Generate a Gravatar avatar URL for the given email.
 *
 * Uses SHA-256 hashing (Gravatar's recommended algorithm).
 *
 * @param email      - User's email address. Trimmed and lowercased before hashing.
 * @param size       - Avatar size in pixels (default: 80).
 * @param defaultType - Fallback avatar type when no Gravatar is set.
 *                     `"mp"` (mystery person), `"identicon"`, `"monsterid"`,
 *                     `"wavatar"`, `"retro"`, `"robohash"`, or `"blank"`.
 * @returns Full Gravatar URL (e.g. `https://www.gravatar.com/avatar/...?s=80&d=mp`).
 */
export async function getGravatarUrl(
    email: string,
    size = 80,
    defaultType: "mp" | "identicon" | "monsterid" | "wavatar" | "retro" | "robohash" | "blank" = "mp",
): Promise<string> {
    const normalized = email.trim().toLowerCase()
    const data = new TextEncoder().encode(normalized)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultType}`
}
