import { defineConfig } from "astro/config";
import { loadConfig } from "./src/lib/config/index.ts";
import fs from "node:fs";

const lixent = loadConfig();
const fontsUrl =
  "https://raw.githubusercontent.com/edgarcnp/lixent/fonts-data/fonts.json";

/** Astro integration that copies lixent.config.json and fetches the font catalog into public/. */
function lixentPublicAssets() {
  return {
    name: "lixent-public-assets",
    hooks: {
      "astro:config:done": async ({ logger }) => {
        fs.mkdirSync("public", { recursive: true });

        if (fs.existsSync("lixent.config.json")) {
          fs.copyFileSync("lixent.config.json", "public/lixent.config.json");
        }

        let fontCatalog = null;
        let fetchError = null;

        try {
          const res = await fetch(fontsUrl, { signal: AbortSignal.timeout(30_000) });
          if (!res.ok) {
            fetchError = `Font catalog fetch failed (${res.status})`;
          } else {
            const data = await res.json();
            const items = Array.isArray(data?.items) ? data.items : [];
            fontCatalog = items.filter(
              (f) =>
                f &&
                typeof f.family === "string" &&
                Array.isArray(f.variants) &&
                typeof f.category === "string",
            );
          }
        } catch (err) {
          fetchError = err instanceof Error ? err.message : String(err);
        }

        if (fontCatalog != null && fontCatalog.length > 0) {
          fs.writeFileSync(
            "public/fonts.json",
            JSON.stringify({ items: fontCatalog }),
          );
          logger.info(`Font catalog: ${fontCatalog.length} fonts`);
        } else {
          const reason = fetchError ?? "no valid fonts found";
          if (!fs.existsSync("public/fonts.json")) {
            throw new Error(
              `[lixent] ${reason} and no existing public/fonts.json found.`,
            );
          }
          logger.warn(
            `Font catalog: ${reason}, using existing public/fonts.json`,
          );
        }
      },
    },
  };
}

export default defineConfig({
  site: lixent.url,
  base: lixent.basePath,
  image: {
    domains: ["www.gravatar.com", "secure.gravatar.com"],
  },
  integrations: [lixentPublicAssets()],
});
