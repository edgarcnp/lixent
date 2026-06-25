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
      "astro:build:start": async () => {
        fs.mkdirSync("public", { recursive: true });

        if (fs.existsSync("lixent.config.json")) {
          fs.copyFileSync("lixent.config.json", "public/lixent.config.json");
        }

        try {
          const res = await fetch(fontsUrl);
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
              console.log(`Font catalog: ${valid.length} fonts`);
            } else {
              console.warn(
                "Font catalog: no valid fonts found, using existing public/fonts.json",
              );
            }
          } else {
            console.warn(
              `Font catalog fetch failed (${res.status}), using existing public/fonts.json`,
            );
          }
        } catch {
          console.warn(
            "Font catalog fetch failed, using existing public/fonts.json",
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
    domains: ["gravatar.com"],
  },
  integrations: [lixentPublicAssets()],
});
