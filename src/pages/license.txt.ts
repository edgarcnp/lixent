import { loadConfig } from "../lib/config.ts"
import { getLicenseText } from "../licenses/index.ts"

export const GET = () => {
    const config = loadConfig()
    const renderedText = getLicenseText(config)

    return new Response(renderedText, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    })
}
