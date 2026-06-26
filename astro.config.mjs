import { defineConfig } from "astro/config";
import { loadConfig } from "./src/lib/config.ts";
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

        try {
          const res = await fetch(fontsUrl, { signal: AbortSignal.timeout(30_000) });
          if (res.ok) {
            const data = await res.json();
            const items = Array.isArray(data?.items) ? data.items : [];
            const valid = items.filter(
              (f) =>
                f &&
                typeof f.family === "string" &&
                Array.isArray(f.variants) &&
                typeof f.category === "string",
            );
            if (valid.length > 0) {
              fs.writeFileSync(
                "public/fonts.json",
                JSON.stringify({ items: valid }),
              );
              logger.info(`Font catalog: ${valid.length} fonts`);
            } else {
              if (!fs.existsSync("public/fonts.json")) {
                throw new Error(
                  "[lixent] Font catalog returned no valid fonts and no existing public/fonts.json found.",
                );
              }
              logger.warn(
                "Font catalog: no valid fonts found, using existing public/fonts.json",
              );
            }
          } else {
            if (!fs.existsSync("public/fonts.json")) {
              throw new Error(
                `[lixent] Font catalog fetch failed (${res.status}) and no existing public/fonts.json found.`,
              );
            }
            logger.warn(
              `Font catalog fetch failed (${res.status}), using existing public/fonts.json`,
            );
          }
        } catch {
          if (!fs.existsSync("public/fonts.json")) {
            throw new Error(
              "[lixent] Font catalog fetch failed and no existing public/fonts.json found. " +
              "Commit a fonts.json to public/ or ensure the fonts-data branch is reachable.",
            );
          }
          logger.warn("Font catalog fetch failed, using existing public/fonts.json");
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
