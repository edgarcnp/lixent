import { getGravatarUrl } from "../lib/gravatar.ts"

export { getGravatarUrl }

export async function checkGravatarProfile(email: string): Promise<boolean> {
    return new Promise((resolve) => {
        const timer = setTimeout(() => { resolve(false) }, 5000)
        const img = new Image()
        img.onload = () => { clearTimeout(timer); resolve(true) }
        img.onerror = () => { clearTimeout(timer); resolve(false) }
        void getGravatarUrl(email, 1, "404").then((url) => { img.src = url })
    })
}
