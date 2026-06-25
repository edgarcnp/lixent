// @ts-check
import { defineConfig } from "astro/config";
import { loadConfig } from "./src/lib/config.ts";
import fs from "node:fs";

const lixent = loadConfig();
const repoOwner = "edgarcnp";
const repoName = "lixent";
const fontsBranch = "fonts-data";
const fontsUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${fontsBranch}/fonts.json`;

export default defineConfig({
  site: lixent.url,
  base: lixent.basePath,
  image: {
    domains: ["gravatar.com"],
  },
  hooks: {
    "build:start": async () => {
      try {
        const res = await fetch(fontsUrl);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data?.items) ? data.items : [];
          const valid = items.filter(
            (f) => f && typeof f.family === "string" && Array.isArray(f.variants) && typeof f.category === "string"
          );
          if (valid.length > 0) {
            fs.mkdirSync("public", { recursive: true });
            fs.writeFileSync("public/fonts.json", JSON.stringify({ items: valid }));
            console.log(`Font catalog: ${valid.length} fonts`);
          } else {
            console.warn("Font catalog: no valid fonts found, using existing public/fonts.json");
          }
        } else {
          console.warn(`Font catalog fetch failed (${res.status}), using existing public/fonts.json`);
        }
      } catch {
        console.warn("Font catalog fetch failed, using existing public/fonts.json");
      }
    },
  },
});
