import { getGravatarUrl } from "../lib/gravatar.ts"

export { getGravatarUrl }

export function checkGravatarProfile(email: string): Promise<boolean> {
    return new Promise((resolve) => {
        const timer = setTimeout(() => { resolve(false) }, 5000)
        const img = new Image()
        img.onload = () => { clearTimeout(timer); resolve(true) }
        img.onerror = () => { clearTimeout(timer); resolve(false) }
        img.src = getGravatarUrl(email, 1, "404")
    })
}
