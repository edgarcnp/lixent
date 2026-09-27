import { getGravatarUrl } from "../../core/gravatar.ts"

export { getGravatarUrl }

/** True when the email has a Gravatar profile (the `404` fallback errors). */
export async function checkGravatarProfile(email: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => {
            resolve(false)
        }, 5000)
        const img = new Image()
        img.onload = () => {
            clearTimeout(timer)
            resolve(true)
        }
        img.onerror = () => {
            clearTimeout(timer)
            resolve(false)
        }
        void getGravatarUrl(email, 1, "404").then((url) => {
            img.src = url
        })
    })
}
