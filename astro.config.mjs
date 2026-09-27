import { defineConfig } from "astro/config"
import fs from "node:fs"
import { loadConfig } from "./src/core/config/loader.ts"

const config = loadConfig()
const demoMode = process.env.LIXENT_DEMO === "1"
const FONTS_URL = "https://raw.githubusercontent.com/edgarcnp/lixent/fonts-data/fonts.json"

/** Writes the best-effort Google Fonts catalog for the demo font picker. */
async function writeFontCatalog(logger) {
    const target = "public/fonts.json"
    try {
        const response = await fetch(FONTS_URL, { signal: AbortSignal.timeout(30_000) })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        const items = Array.isArray(data?.items) ? data.items : []
        const fonts = items
            .filter((item) =>
                item &&
                typeof item.family === "string" &&
                Array.isArray(item.variants) &&
                typeof item.category === "string",
            )
            .map((item) => ({ family: item.family, variants: item.variants, category: item.category }))
        if (fonts.length === 0) throw new Error("no valid fonts found")
        fs.writeFileSync(target, JSON.stringify({ items: fonts }))
        logger.info(`Font catalog: ${fonts.length} fonts`)
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        if (fs.existsSync(target)) {
            logger.warn(`Font catalog fetch failed (${reason}); using existing public/fonts.json`)
        } else {
            logger.warn(`Font catalog unavailable (${reason}); the demo font picker will be empty`)
        }
    }
}

/** Adds the /demo route and its public assets, only when LIXENT_DEMO=1. */
function lixentDemo() {
    return {
        name: "lixent-demo",
        hooks: {
            "astro:config:setup": ({ injectRoute, logger }) => {
                if (!demoMode) return
                injectRoute({ pattern: "/demo", entrypoint: "./src/site/demo/page.astro" })
                logger.info("Demo mode enabled: /demo")
            },
            "astro:config:done": async ({ logger }) => {
                if (!demoMode) return
                fs.mkdirSync("public", { recursive: true })
                fs.copyFileSync("lixent.config.json", "public/lixent.config.json")
                await writeFontCatalog(logger)
            },
        },
    }
}

export default defineConfig({
    srcDir: "./src/site",
    base: config.basePath,
    image: {
        domains: ["www.gravatar.com", "secure.gravatar.com"],
    },
    integrations: [lixentDemo()],
})
