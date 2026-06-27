import { $, isValidEmail, isValidUrl } from "./helpers.ts"
import { checkGravatarProfile } from "./gravatar.ts"

export interface Warnings {
    updateGravatarWarning: () => void
    updateGravatarProfileWarning: () => Promise<void>
    updateUrlWarning: () => void
}

export function createWarnings(
    emailInput: HTMLInputElement,
    urlInput: HTMLInputElement,
    gravatarToggle: HTMLInputElement,
): Warnings {
    const emailWarning = $("email-warning")
    const urlWarning = $("url-warning")
    const gravatarWarning = $("gravatar-warning")
    let pendingGravatarEmail = ""

    function updateGravatarWarning(): void {
        const email = emailInput.value.trim()
        const show = gravatarToggle.checked && email.length === 0
        emailWarning.style.display = show ? "flex" : "none"
        emailInput.classList.toggle("warn", show)
    }

    async function updateGravatarProfileWarning(): Promise<void> {
        const email = emailInput.value.trim()
        if (!gravatarToggle.checked || !isValidEmail(email)) {
            gravatarWarning.style.display = "none"
            return
        }
        pendingGravatarEmail = email
        const exists = await checkGravatarProfile(email)
        if (email !== pendingGravatarEmail) return
        gravatarWarning.style.display = exists ? "none" : "block"
    }

    function updateUrlWarning(): void {
        const url = urlInput.value.trim()
        const show = url.length > 0 && !isValidUrl(url)
        urlWarning.style.display = show ? "flex" : "none"
        urlInput.classList.toggle("warn", show)
    }

    return { updateGravatarWarning, updateGravatarProfileWarning, updateUrlWarning }
}
