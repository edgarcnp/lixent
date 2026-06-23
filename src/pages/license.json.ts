import { loadConfig } from "../lib/config.ts";
import { getLicenseText, getLicenseName } from "../licenses/index.ts";

export const GET = () => {
  const config = loadConfig();
  const renderedText = getLicenseText(config);
  const licenseName = getLicenseName(config);

  const body = {
    copyright: config.copyright,
    license: licenseName,
    year: config.year ?? new Date().getFullYear(),
    text: renderedText,
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};
