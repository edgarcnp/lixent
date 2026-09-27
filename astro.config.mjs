import { defineConfig } from "astro/config"
import { loadConfig } from "./src/core/config/loader.ts"

const { basePath } = loadConfig()

export default defineConfig({
    srcDir: "./src/site",
    base: basePath,
    image: {
        domains: ["www.gravatar.com", "secure.gravatar.com"],
    },
})
