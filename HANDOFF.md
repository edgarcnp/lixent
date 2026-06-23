# Lixent - Agent Handoff

## Project Overview

**Lixent** is a modern, self-hosted license page generator. It's like mit-license.org but for every license, with beautiful themes and a developer-friendly onboarding experience. Users configure their identity once, and deploy the generated static HTML to any hosting platform.

**Key difference from mit-license.org:** Lixent is NOT a hosted service. Users self-host on GitHub Pages, GitLab Pages, Cloudflare Pages, Netlify, Vercel, or their own server. They control their own domain.

## Tech Stack

- **Framework:** Astro 7 (SSG mode - static site generation)
- **Package manager:** pnpm
- **Node:** >= 22.12.0
- **Language:** TypeScript
- **Styling:** Vanilla CSS with custom properties (NO Tailwind)
- **CLI:** Will use `citty` or `commander` + `@clack/prompts`

## Decisions Made

| Decision | Choice |
|----------|--------|
| Project name | Lixent |
| Config file | `lixent.config.json` (primary), `package.json` `"lixent"` key (fallback) |
| Hosting | Self-hosted only. Users deploy to their own static host. |
| User data | Single user per instance. Config IS the user data. |
| Themes | CSS custom properties. No Tailwind. |
| CLI | User-friendly. Abstracts `astro dev`/`astro build` behind `lixent start`/`lixent generate`. |
| Licenses | SPDX license-list-data as source of truth. |
| Distribution | Fork repo OR CLI-generated. Both supported. |
| URL mode | User chooses subdomain or subpath via `basePath` + `urlMode` config. |

## Current State

The project is at the **very beginning of Phase 1**. Files have been migrated from the old `license-page/` directory. The `src/` directory contains the default Astro starter template (Welcome component, default assets) that needs to be cleaned up.

### What exists now:
- `package.json` - Named "lixent", Astro 7 dependency
- `astro.config.mjs` - Empty/default config
- `tsconfig.json` - Extends astro/tsconfigs/strict
- `src/pages/index.astro` - Default Astro welcome page
- `src/layouts/Layout.astro` - Basic HTML layout
- `src/components/Welcome.astro` - Default Astro welcome component (TO BE DELETED)
- `src/assets/` - Default Astro assets (TO BE DELETED)
- `public/` - Default favicons
- `PLAN.md` - Full project plan with all decisions documented

### What needs to happen next (Phase 1):

1. **Clean up starter template:**
   - Delete `src/components/Welcome.astro`
   - Delete `src/assets/astro.svg` and `src/assets/background.svg`
   - Rewrite `src/pages/index.astro` to be the license page
   - Update `src/layouts/Layout.astro` title and metadata

2. **Create core library files:**
   - `src/lib/types.ts` - TypeScript interfaces for `LixentConfig`
   - `src/lib/config.ts` - Load `lixent.config.json` with `package.json` fallback
   - `src/lib/gravatar.ts` - Gravatar URL generation (MD5 hash of email)
   - `src/lib/year.ts` - Year formatting (current year, year range)

3. **Create styling system:**
   - `src/styles/variables.css` - Default CSS custom properties
   - `src/styles/base.css` - Reset and base layout styles

4. **Create layout and components:**
   - `src/layouts/LicenseLayout.astro` - HTML shell that loads theme CSS
   - `src/components/LicenseBody.astro` - Renders license text paragraphs
   - `src/components/Footer.astro` - "Powered by Lixent" footer
   - `src/components/Gravatar.astro` - Gravatar image component

5. **Create first license template:**
   - `src/licenses/MIT.astro` - Full MIT license text from SPDX
   - `src/licenses/index.ts` - License registry mapping SPDX IDs to components

6. **Create first theme:**
   - `src/themes/minimal.css` - Clean serif theme
   - `src/themes/index.ts` - Theme registry with metadata

7. **Create a sample config:**
   - `lixent.config.json` - Example config for dogfooding

8. **Update Astro config:**
   - `astro.config.mjs` - Read `basePath` from lixent config, set `site` and `base`

## Config Schema

```typescript
interface LixentConfig {
  copyright: string;
  url?: string;
  email?: string;
  license: string;  // SPDX ID or "custom"
  customLicense?: {
    name: string;
    text: string;  // Supports {{year}}, {{name}}, {{url}}, {{email}}
  };
  theme: string;  // Built-in name or path to custom CSS
  themeOverrides?: Record<string, string>;
  gravatar?: boolean;
  format?: 'html' | 'txt' | 'json';
  basePath?: string;  // For subpath deploys, e.g. "/license"
  urlMode?: 'subpath' | 'subdomain';
  year?: number;
  yearRange?: { start: number; end: number };
}
```

## CSS Custom Properties (Theme System)

Every theme must define these variables:

```css
:root {
  --lp-bg: #ffffff;
  --lp-text: #1a1a1a;
  --lp-text-muted: #666666;
  --lp-accent: #2563eb;
  --lp-border: #e5e7eb;
  --lp-surface: #f9fafb;
  --lp-font-body: "Inter", system-ui, sans-serif;
  --lp-font-mono: "JetBrains Mono", monospace;
  --lp-font-size: 1.125rem;
  --lp-line-height: 1.7;
  --lp-max-width: 720px;
  --lp-padding: 2.5rem;
  --lp-border-radius: 8px;
}
```

## CLI Commands (Phase 4, but keep in mind for architecture)

| Command | Wraps | Purpose |
|---------|-------|---------|
| `lixent init` | - | Interactive setup wizard |
| `lixent start` | `astro dev --port 3000` | Local preview |
| `lixent generate` | `astro build` | Build for deployment |
| `lixent themes` | - | Browse themes |
| `lixent validate` | - | Check config |

## Route Structure

Since this is single-user static:

```
/                  # The license page (main page)
/license.txt       # Plain text version
/license.json      # JSON version
```

## License Text Source

Standard license text comes from SPDX: https://github.com/spdx/license-list-data

A script (`scripts/fetch-spdx.ts`) will pull license texts into `src/data/licenses/*.json`.

## Important Notes

- **No Tailwind.** CSS custom properties only. Keep it simple.
- **No multi-user mode.** Single user per instance.
- **No SSR.** Pure static site generation.
- **No JavaScript in the output.** The license page is HTML + CSS only.
- The `mit-license-master/` reference directory has been deleted. Everything useful is in `PLAN.md`.

## PLAN.md

The full project plan is in `PLAN.md`. Read it for:
- Complete directory structure
- Implementation phases with checklists
- Deployment guides for each platform
- Theme examples
- API reference
- Competitive analysis

## Development Commands

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full Astro documentation: https://docs.astro.build

Key guides to consult:
- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Adding styles](https://docs.astro.build/en/guides/styling/)
