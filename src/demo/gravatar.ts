import { getGravatarUrl } from "../lib/gravatar.ts"

export { getGravatarUrl }

export function checkGravatarProfile(email: string): Promise<boolean> {
    return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
        img.src = getGravatarUrl(email, 1, "404")
    })
}
