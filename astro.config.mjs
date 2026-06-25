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
          fs.mkdirSync("public", { recursive: true });
          fs.writeFileSync("public/fonts.json", JSON.stringify(data));
          console.log(`Font catalog: ${data.items?.length ?? 0} fonts`);
        } else {
          console.warn(`Font catalog fetch failed (${res.status}), using existing public/fonts.json`);
        }
      } catch {
        console.warn("Font catalog fetch failed, using existing public/fonts.json");
      }
    },
  },
});
