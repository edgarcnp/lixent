import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const CORE_LICENSES = [
  { id: "MIT", name: "MIT" },
  { id: "Apache-2.0", name: "Apache 2.0" },
  { id: "BSD-2-Clause", name: "BSD 2-Clause" },
  { id: "BSD-3-Clause", name: "BSD 3-Clause" },
  { id: "ISC", name: "ISC" },
  { id: "MPL-2.0", name: "MPL 2.0" },
  { id: "GPL-2.0-only", name: "GPL v2" },
  { id: "GPL-3.0-only", name: "GPL v3" },
  { id: "LGPL-2.1-only", name: "LGPL v2.1" },
  { id: "LGPL-3.0-only", name: "LGPL v3" },
  { id: "AGPL-3.0-only", name: "AGPL v3" },
  { id: "Unlicense", name: "Unlicense" },
  { id: "CC0-1.0", name: "CC0 1.0" },
  { id: "WTFPL", name: "WTFPL" },
  { id: "0BSD", name: "0BSD" },
] as const;

const SPDX_BASE = "https://raw.githubusercontent.com/spdx/license-list-data/main/text";
const OUTPUT_DIR = resolve(import.meta.dirname, "../src/data/licenses");

function convertPlaceholders(text: string): string {
  return text
    .replace(/<year>/g, "{{year}}")
    .replace(/<copyright holders>/g, "{{name}}")
    .replace(/<name of copyright holder>/g, "{{name}}")
    .replace(/\[year\]/g, "{{year}}")
    .replace(/\[name of copyright holder\]/g, "{{name}}")
    .replace(/\[fullname\]/g, "{{name}}");
}

async function fetchLicense(id: string): Promise<string> {
  const url = `${SPDX_BASE}/${id}.txt`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${id}: ${response.statusText}`);
  }
  return response.text();
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const index: Record<string, { name: string; file: string }> = {};

  for (const license of CORE_LICENSES) {
    console.log(`Fetching ${license.id}...`);
    const text = await fetchLicense(license.id);
    const converted = convertPlaceholders(text);

    const fileName = `${license.id}.json`;
    const filePath = resolve(OUTPUT_DIR, fileName);

    const data = {
      id: license.id,
      name: license.name,
      text: converted,
    };

    writeFileSync(filePath, JSON.stringify(data, null, 2));
    index[license.id] = { name: license.name, file: fileName };
    console.log(`  Saved ${fileName}`);
  }

  const indexPath = resolve(OUTPUT_DIR, "index.json");
  writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(`\nSaved index with ${CORE_LICENSES.length} licenses`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
