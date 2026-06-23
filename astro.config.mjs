// @ts-check
import { defineConfig } from "astro/config";
import { loadConfig } from "./src/lib/config.ts";

const lixent = loadConfig();

export default defineConfig({
  site: lixent.url,
  base: lixent.basePath,
});
