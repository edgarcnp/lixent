/**
 * Gravatar URL generation.
 *
 * Gravatar determines the avatar from an MD5 hash of the user's email.
 * The email is trimmed and lowercased before hashing to ensure consistency.
 *
 * @see {@link https://docs.gravatar.com/api/avatars/images/ | Gravatar API}
 * @module
 */

import md5 from "md5"

/**
 * Generate a Gravatar avatar URL for the given email.
 *
 * @param email      - User's email address. Trimmed and lowercased before hashing.
 * @param size       - Avatar size in pixels (default: 80).
 * @param defaultType - Fallback avatar type when no Gravatar is set.
 *                     `"mp"` (mystery person), `"identicon"`, `"monsterid"`,
 *                     `"wavatar"`, `"retro"`, `"robohash"`, or `"blank"`.
 * @returns Full Gravatar URL (e.g. `https://www.gravatar.com/avatar/...?s=64&d=mp`).
 */
export function getGravatarUrl(
    email: string,
    size = 80,
    defaultType: "mp" | "identicon" | "monsterid" | "wavatar" | "retro" | "robohash" | "blank" = "mp",
): string {
    const hash = md5(email.trim().toLowerCase())
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultType}`
}
