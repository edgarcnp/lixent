// @ts-check
import { defineConfig } from "astro/config";
import { loadConfig } from "./src/lib/config.ts";

const lixent = loadConfig();

export default defineConfig(({ command }) => ({
  site: command === "build" ? lixent.url : undefined,
  base: command === "build" ? lixent.basePath : undefined,
}));
