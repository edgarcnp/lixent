# Lixent - Project Plan

> A modern, extensible license page generator. Like mit-license.org, but for **every** license, with beautiful themes and a developer-friendly onboarding experience. Self-hosted by the user on any static hosting platform.

---

## Table of Contents

1. [Vision & Goals](#1-vision--goals)
2. [Finalized Decisions](#2-finalized-decisions)
3. [Architecture Overview](#3-architecture-overview)
4. [Configuration](#4-configuration)
5. [License Library](#5-license-library)
6. [Onboarding Flow](#6-onboarding-flow)
7. [Theme System](#7-theme-system)
8. [Page Rendering & Routes](#8-page-rendering--routes)
9. [Design System](#9-design-system)
10. [Directory Structure](#10-directory-structure)
11. [Implementation Phases](#11-implementation-phases)
12. [Deployment Guide](#12-deployment-guide)
13. [Competitive Analysis](#13-competitive-analysis)

---

## 1. Vision & Goals

### What is Lixent?

A **self-hosted license page generator** that produces beautiful, themed license pages as static HTML. Users configure their identity once (name, email, URL, license type, theme), and deploy the generated site to any static hosting platform - GitHub Pages, GitLab Pages, Codeberg Pages, Cloudflare Pages, Netlify, Vercel, or their own server.

Unlike mit-license.org, Lixent is **not a hosted service**. Users own their data, their deployment, and their domain. They can use a custom domain or a subpath on any domain they control.

### Core Goals

1. **Multi-license support** - 15+ standard licenses from SPDX + fully custom license text.
2. **Beautiful defaults** - Minimalist but modern design. Not 2012-era CSS.
3. **User-friendly CLI** - Interactive onboarding that abstracts build/dev/production behind friendly commands.
4. **Static-first** - Generated HTML with zero runtime dependencies. Deploy anywhere.
5. **Themeable** - Curated built-in themes + user-created themes via CSS custom properties.
6. **Standards-compliant** - License text sourced from SPDX license-list-data.
7. **Custom domains** - Full support for custom domains and subpath deployments via `basePath`.

### Non-Goals

- Multi-user hosted service (each user runs their own instance)
- License comparison tool
- Legal advice
- Dynamic license generation (use custom license text for that)

---

## 2. Finalized Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | **Project name** | Lixent |
| 2 | **Hosting model** | Self-hosted only. Users deploy to their own static host. |
| 3 | **Config file** | `lixent.config.json` (primary), `package.json` `"lixent"` key (fallback) |
| 4 | **User data** | Single user per instance. Config is the user data. |
| 5 | **Theme architecture** | CSS custom properties. No Tailwind. |
| 6 | **CLI** | User-friendly. Abstracts `astro dev`/`astro build` behind `lixent start`/`lixent generate`. |
| 7 | **License text** | SPDX license-list-data as source of truth. |
| 8 | **Distribution** | Fork repo OR CLI-generated into existing project. Both supported. |
| 9 | **URL mode** | User chooses subdomain or subpath. Configurable via `basePath` and `urlMode`. |

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        User's Workflow                           │
│                                                                  │
│   Option A: Fork                  Option B: CLI                  │
│   ┌──────────────┐               ┌──────────────┐               │
│   │ Fork Lixent  │               │ npx lixent   │               │
│   │ repo on      │               │ init         │               │
│   │ GitHub       │               │              │               │
│   └──────┬───────┘               └──────┬───────┘               │
│          │                              │                        │
│          ▼                              ▼                        │
│   ┌──────────────┐               ┌──────────────┐               │
│   │ Edit         │               │ lixent.config│               │
│   │ lixent.config│               │ .json created│               │
│   │ .json        │               └──────┬───────┘               │
│   └──────┬───────┘                      │                        │
│          │                              │                        │
│          ▼                              ▼                        │
│   ┌─────────────────────────────────────────────┐                │
│   │           lixent generate (or start)        │                │
│   │           (wraps astro build / dev)         │                │
│   └──────────────────┬──────────────────────────┘                │
│                      │                                           │
│                      ▼                                           │
│   ┌──────────────────────────────────────┐                       │
│   │          Static HTML Output          │                       │
│   │     (dist/ directory)                │                       │
│   └──────────────────┬───────────────────┘                       │
│                      │                                           │
└──────────────────────┼───────────────────────────────────────────┘
                       │
                       ▼
   ┌───────────────────────────────────────────────┐
   │              User Deploys To:                 │
   │   ├── GitHub Pages (username.github.io)       │
   │   ├── GitLab Pages (namespace.gitlab.io)      │
   │   ├── Codeberg Pages (codeberg.page)          │
   │   ├── Cloudflare Pages                        │
   │   ├── Netlify / Vercel                        │
   │   └── Custom server (nginx, caddy, etc.)      │
   └───────────────────────────────────────────────┘
```

### How It Works

1. **Static Site Generation (SSG)** - Astro compiles the license page into pure HTML/CSS at build time.
2. **Zero runtime** - No Node.js server needed. No database. No API calls.
3. **Config-driven** - `lixent.config.json` is the single source of truth.
4. **Theme as CSS** - Themes are plain CSS files with custom properties. No build step for themes.

---

## 4. Configuration

### Config File: `lixent.config.json`

```jsonc
{
  // Copyright holder name
  "copyright": "Remy Sharp",

  // Optional: URL for the copyright holder (clickable link in the page)
  "url": "https://remysharp.com",

  // Optional: email (used for Gravatar if enabled)
  "email": "remy@remysharp.com",

  // SPDX license ID (e.g., "MIT", "Apache-2.0", "GPL-3.0-only")
  // Or "custom" to use customLicense
  "license": "MIT",

  // Only required when "license" is "custom"
  "customLicense": {
    "name": "My Custom License",
    "text": "This software is provided 'as-is'..."
  },

  // Theme: built-in name OR path to custom CSS file
  "theme": "minimal",

  // Optional: override CSS custom properties for the selected theme
  "themeOverrides": {
    "--lp-bg": "#1a1a1a",
    "--lp-text": "#e5e5e5"
  },

  // Show Gravatar avatar (requires email)
  "gravatar": false,

  // Output format: "html" (default) | "txt" | "json"
  "format": "html",

  // Base path for subpath deployments
  // Example: "/license" for username.github.io/license/
  // Leave as "" or omit for root deployments (custom domain)
  "basePath": "",

  // URL mode: "subpath" (default) or "subdomain"
  // This affects how the CLI generates deployment instructions
  // and how internal links are constructed
  "urlMode": "subpath"
}
```

### package.json Fallback

If `lixent.config.json` is not found, Lixent reads from `package.json`:

```json
{
  "name": "my-project",
  "lixent": {
    "copyright": "Remy Sharp",
    "url": "https://remysharp.com",
    "license": "MIT",
    "theme": "minimal"
  }
}
```

Priority: `lixent.config.json` > `package.json` `"lixent"` key.

### URL Mode Explained

**`subpath` mode (default):**
- Site lives at `username.github.io/your-repo/`
- `basePath: ""` → `yourdomain.com/`
- `basePath: "/license"` → `yourdomain.com/license/`
- Works everywhere, no DNS configuration needed

**`subdomain` mode:**
- Site lives at `yourname.yourdomain.com`
- `basePath` is ignored (always root)
- Requires wildcard DNS record or manual DNS setup
- Better for custom domains (e.g., `license.johndoe.com`)

The CLI uses this setting to generate platform-specific deployment instructions.

---

## 5. License Library

### Supported Licenses (Phase 1 - Core)

| License | SPDX ID | Category |
|---------|---------|----------|
| MIT | MIT | Permissive |
| Apache 2.0 | Apache-2.0 | Permissive |
| BSD 2-Clause | BSD-2-Clause | Permissive |
| BSD 3-Clause | BSD-3-Clause | Permissive |
| ISC | ISC | Permissive |
| MPL 2.0 | MPL-2.0 | Weak Copyleft |
| GPL v2 | GPL-2.0-only | Copyleft |
| GPL v3 | GPL-3.0-only | Copyleft |
| LGPL v2.1 | LGPL-2.1-only | Copyleft |
| LGPL v3 | LGPL-3.0-only | Copyleft |
| AGPL v3 | AGPL-3.0-only | Copyleft |
| Unlicense | Unlicense | Public Domain |
| CC0 1.0 | CC0-1.0 | Public Domain |
| WTFPL | WTFPL | Public Domain |
| 0BSD | 0BSD | Public Domain |

### Supported Licenses (Phase 2 - Extended)

| License | SPDX ID | Category |
|---------|---------|----------|
| EPL 2.0 | EPL-2.0 | Weak Copyleft |
| CDDL 1.0 | CDDL-1.0 | Weak Copyleft |
| Artistic 2.0 | Artistic-2.0 | Weak Copyleft |
| BlueOak 1.0.0 | BlueOak-1.0.0 | Permissive |
| Zlib | Zlib | Permissive |
| Boost 1.0 | BSL-1.0 | Permissive |
| ICU | ICU | Permissive |

### Custom License Support

When `"license": "custom"`, users provide their own license text:

```jsonc
{
  "license": "custom",
  "customLicense": {
    "name": "My Custom License",
    "text": "Copyright (c) {{year}} {{name}}\n\nPermission is hereby granted..."
  }
}
```

Template variables in custom license text:
- `{{year}}` - Current year or year range (e.g., "2024" or "2020-2024")
- `{{name}}` - Copyright holder name
- `{{url}}` - Copyright holder URL (if provided)
- `{{email}}` - Copyright holder email (if provided)

### License Data Source

Standard license text is sourced from [SPDX license-list-data](https://github.com/spdx/license-list-data). A build script (`scripts/fetch-spdx.ts`) pulls the latest license texts and stores them in `src/data/licenses/`.

Each license template is an Astro component that receives the copyright info and renders the proper SPDX text.

---

## 6. Onboarding Flow

### CLI: `lixent`

The CLI is the primary interface. It wraps Astro commands behind user-friendly names:

| CLI Command | What It Does | Under the Hood |
|-------------|--------------|----------------|
| `npx lixent init` | Interactive setup wizard | Creates `lixent.config.json` |
| `npx lixent start` | Preview locally with live reload | `astro dev --port 3000` |
| `npx lixent generate` | Build static output for deployment | `astro build` |
| `npx lixent themes` | Browse and preview available themes | Lists themes with descriptions |
| `npx lixent validate` | Check config file for errors | Parses and validates `lixent.config.json` |

### Interactive `init` Flow

```
$ npx lixent init

  ╭──────────────────────────────────────────╮
  │                                          │
  │        Lixent - License Page Setup       │
  │                                          │
  ╰──────────────────────────────────────────╯

  ? Your name: Remy Sharp
  ? Your URL (optional): https://remysharp.com
  ? Your email (optional, for Gravatar): remy@remysharp.com

  ? Select a license: (Type to search)
  ❯ MIT License
    Apache License 2.0
    BSD 2-Clause "Simplified"
    BSD 3-Clause "New" / "Revised"
    GNU General Public License v3.0
    ISC License
    Mozilla Public License 2.0
    The Unlicense
    Custom license text...

  ? Select a theme: (Type to search)
  ❯ minimal          Clean and timeless
    minimal-dark     Clean with dark background
    github           GitHub README style
    terminal         Retro terminal aesthetic
    newspaper        Formal editorial style
    elegant          High-contrast professional
    mono             Pure monospace, no decoration
    sans             Modern sans-serif
    serif            Traditional book-like
    [custom]         Provide your own CSS file

  ? Show Gravatar avatar? No

  ? Deployment target: (auto-detected)
  ❯ GitHub Pages
    GitLab Pages
    Cloudflare Pages
    Netlify
    Vercel
    Custom domain

  ? Base path (for subpath deploys, e.g. "/license"): 

  ✓ Created lixent.config.json
  ✓ Run `npx lixent start` to preview your license page
```

### Post-init Workflow

```bash
# After init:
npx lixent start        # Preview at localhost:3000

# When ready to deploy:
npx lixent generate     # Build static output in dist/

# Deploy dist/ to your hosting platform
```

### Manual Setup (No CLI)

Users who prefer not to use the CLI can create `lixent.config.json` manually:

```json
{
  "copyright": "Remy Sharp",
  "url": "https://remysharp.com",
  "license": "MIT",
  "theme": "minimal"
}
```

Then install and run:
```bash
pnpm install
pnpm dev        # or: npx lixent start
pnpm build      # or: npx lixent generate
```

---

## 7. Theme System

### Architecture

Themes use CSS custom properties. Every theme sets the same variables, and users can override any of them:

```css
:root {
  /* Colors */
  --lp-bg: #ffffff;
  --lp-text: #1a1a1a;
  --lp-text-muted: #666666;
  --lp-accent: #2563eb;
  --lp-border: #e5e7eb;
  --lp-surface: #f9fafb;

  /* Typography */
  --lp-font-body: "Inter", system-ui, sans-serif;
  --lp-font-mono: "JetBrains Mono", monospace;
  --lp-font-size: 1.125rem;
  --lp-line-height: 1.7;

  /* Layout */
  --lp-max-width: 720px;
  --lp-padding: 2.5rem;
  --lp-border-radius: 8px;
}
```

### Built-In Themes

| Theme | Description | Dark? |
|-------|-------------|-------|
| `minimal` | Clean serif, light bg, timeless | No |
| `minimal-dark` | Same as minimal, dark bg | Yes |
| `github` | GitHub README aesthetic | No |
| `github-dark` | GitHub dark README | Yes |
| `terminal` | Retro terminal, green-on-black | Yes |
| `newspaper` | NYT/journalism style | No |
| `elegant` | High-contrast, refined | No |
| `mono` | Pure monospace, no decoration | No |
| `serif` | Traditional book-like | No |
| `sans` | Modern sans-serif | No |

### Custom Theme Creation

**Option 1: Custom CSS file**
```jsonc
{
  "theme": "./my-theme.css"
}
```

**Option 2: Override built-in theme variables**
```jsonc
{
  "theme": "minimal",
  "themeOverrides": {
    "--lp-bg": "#1a1a1a",
    "--lp-text": "#e5e5e5",
    "--lp-accent": "#22d3ee"
  }
}
```

### Theme Preview

```bash
npx lixent themes              # List all themes in terminal
npx lixent themes --open       # Open theme gallery in browser
```

---

## 8. Page Rendering & Routes

Since Lixent is a single-user static site, the route structure is simple:

### Route Structure

```
/                              # The license page (the main and only page)
/license.txt                   # Plain text version
/license.json                  # JSON version
```

### Year Support via Query Params

Since this is static HTML (no server), year customization is handled via:

- **Build-time**: The year is set at build time from the current date
- **Config-time**: Users can set a fixed year or year range in `lixent.config.json`
- **Manual**: Users edit `lixent.config.json` and rebuild

```jsonc
{
  // By default, year is auto-detected at build time
  // To fix a specific year:
  "year": 2024,

  // Or a year range:
  "yearRange": { "start": 2020, "end": 2024 }
}
```

### Output Formats

| Format | URL | Content-Type |
|--------|-----|-------------|
| HTML | `/` | `text/html` |
| Plain text | `/license.txt` | `text/plain` |
| JSON | `/license.json` | `application/json` |

---

## 9. Design System

### Design Principles

1. **Content-first** - The license text is the hero. Minimal chrome.
2. **Readable** - Optimized typography for legal text.
3. **Respectful** - This is a legal document page. Clear, not playful.
4. **Fast** - No JavaScript. Pure HTML/CSS. Lighthouse 100.
5. **Accessible** - Semantic HTML, proper contrast, screen-reader friendly.

### Base Styles

```css
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-size: var(--lp-font-size);
  line-height: var(--lp-line-height);
  color: var(--lp-text);
  background: var(--lp-bg);
  font-family: var(--lp-font-body);
  -webkit-font-smoothing: antialiased;
}

main {
  max-width: var(--lp-max-width);
  margin: 0 auto;
  padding: var(--lp-padding);
}

h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
}

.copyright {
  font-size: 0.95rem;
  color: var(--lp-text-muted);
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--lp-border);
}

.license-body p {
  margin-bottom: 1rem;
}

footer {
  max-width: var(--lp-max-width);
  margin: 0 auto;
  padding: 1rem var(--lp-padding);
  text-align: center;
  font-size: 0.8rem;
  color: var(--lp-text-muted);
}

footer a {
  color: var(--lp-text-muted);
  text-decoration: none;
}

footer a:hover {
  color: var(--lp-accent);
}
```

### Responsive Breakpoints

| Viewport | Padding | Font Size |
|----------|---------|-----------|
| > 768px | `var(--lp-padding)` | `var(--lp-font-size)` |
| 480-768px | `1.5rem` | `1rem` |
| < 480px | `1rem` | `0.95rem` |

---

## 10. Directory Structure

```
lixent/
├── lixent.config.json            # Project's own config (dogfooding)
├── astro.config.mjs              # Astro configuration
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── PLAN.md                       # This file
│
├── src/
│   ├── pages/
│   │   ├── index.astro           # Main license page
│   │   ├── license.txt.astro     # Plain text output
│   │   └── license.json.astro    # JSON output
│   │
│   ├── layouts/
│   │   └── LicenseLayout.astro   # License page HTML shell
│   │
│   ├── components/
│   │   ├── LicenseBody.astro     # Renders license text
│   │   ├── Gravatar.astro        # Gravatar image
│   │   └── Footer.astro          # "Powered by Lixent" footer
│   │
│   ├── licenses/                 # License templates
│   │   ├── MIT.astro
│   │   ├── Apache-2.0.astro
│   │   ├── BSD-2-Clause.astro
│   │   ├── BSD-3-Clause.astro
│   │   ├── GPL-2.0.astro
│   │   ├── GPL-3.0.astro
│   │   ├── ISC.astro
│   │   ├── LGPL-2.1.astro
│   │   ├── LGPL-3.0.astro
│   │   ├── AGPL-3.0.astro
│   │   ├── MPL-2.0.astro
│   │   ├── Unlicense.astro
│   │   ├── CC0-1.0.astro
│   │   ├── WTFPL.astro
│   │   ├── 0BSD.astro
│   │   ├── _custom.astro         # Custom license template
│   │   └── index.ts             # License registry
│   │
│   ├── themes/                   # Built-in themes
│   │   ├── minimal.css
│   │   ├── minimal-dark.css
│   │   ├── github.css
│   │   ├── github-dark.css
│   │   ├── terminal.css
│   │   ├── newspaper.css
│   │   ├── elegant.css
│   │   ├── mono.css
│   │   ├── serif.css
│   │   ├── sans.css
│   │   └── index.ts             # Theme registry with metadata
│   │
│   ├── styles/
│   │   ├── base.css              # Reset + base styles
│   │   └── variables.css         # Default CSS custom properties
│   │
│   ├── lib/
│   │   ├── config.ts             # Load lixent.config.json
│   │   ├── gravatar.ts           # Gravatar URL generation
│   │   ├── year.ts               # Year formatting
│   │   └── types.ts              # TypeScript interfaces
│   │
│   ├── data/
│   │   └── licenses/             # SPDX license texts (JSON)
│   │       ├── MIT.json
│   │       ├── Apache-2.0.json
│   │       └── ...
│   │
│   └── assets/
│       └── favicon.svg
│
├── public/
│   └── favicon.ico
│
├── cli/                          # CLI source
│   ├── index.ts                  # Entry point
│   ├── commands/
│   │   ├── init.ts               # Interactive setup
│   │   ├── start.ts              # Local preview
│   │   ├── generate.ts           # Build for deployment
│   │   ├── themes.ts             # Theme browser
│   │   └── validate.ts           # Config validation
│   └── utils/
│       ├── prompts.ts            # Interactive prompts (clack)
│       ├── license-picker.ts     # Fuzzy license search
│       ├── theme-picker.ts       # Theme selection
│       └── deploy-hints.ts       # Platform-specific deploy instructions
│
├── scripts/
│   └── fetch-spdx.ts             # Fetch SPDX license data
│
└── mit-license-master/           # Reference implementation (keep for reference)
```

---

## 11. Implementation Phases

### Phase 1: Foundation

**Goal:** Working single-user license page with config-driven rendering.

- [ ] Clean up Astro starter template (remove Welcome component, default assets)
- [ ] Create `src/lib/types.ts` - TypeScript interfaces for config
- [ ] Create `src/lib/config.ts` - Load `lixent.config.json` / `package.json` fallback
- [ ] Create `src/styles/variables.css` - CSS custom property defaults
- [ ] Create `src/styles/base.css` - Reset and base layout styles
- [ ] Create `src/layouts/LicenseLayout.astro` - HTML shell with theme CSS
- [ ] Create `src/components/LicenseBody.astro` - License text renderer
- [ ] Create `src/components/Footer.astro` - Lixent attribution footer
- [ ] Create `src/components/Gravatar.astro` - Gravatar image component
- [ ] Create `src/pages/index.astro` - Main license page
- [ ] Create first license template: `src/licenses/MIT.astro`
- [ ] Create first theme: `src/themes/minimal.css`
- [ ] Configure `astro.config.mjs` with `site` and `base` from config
- [ ] Implement `src/lib/year.ts` - Year formatting
- [ ] Implement `src/lib/gravatar.ts` - Gravatar URL generation

**Deliverable:** `pnpm dev` serves a working MIT license page with the minimal theme.

### Phase 2: License Library

**Goal:** All 15 core licenses + custom license support.

- [ ] Create `scripts/fetch-spdx.ts` to pull SPDX license texts
- [ ] Generate `src/data/licenses/*.json` from SPDX data
- [ ] Implement remaining 14 license templates in `src/licenses/`
- [ ] Create `src/licenses/_custom.astro` for custom license text
- [ ] Create `src/licenses/index.ts` - License registry (SPDX ID → component)
- [ ] Implement template variable interpolation (`{{year}}`, `{{name}}`, etc.)
- [ ] Add license validation in config loader
- [ ] Create `src/pages/license.txt.astro` - Plain text output
- [ ] Create `src/pages/license.json.astro` - JSON output

**Deliverable:** All 15 licenses work. Custom licenses work. TXT and JSON outputs work.

### Phase 3: Theme System

**Goal:** 10 polished themes + custom theme support.

- [ ] Create remaining 9 themes in `src/themes/`
- [ ] Create `src/themes/index.ts` - Theme registry with metadata (name, description, dark flag)
- [ ] Implement custom CSS file theme loading (path in config)
- [ ] Implement `themeOverrides` support in config
- [ ] Add responsive styles to base.css
- [ ] Test all themes for readability and contrast

**Deliverable:** 10 themes selectable via config. Custom themes work.

### Phase 4: CLI

**Goal:** User-friendly CLI that abstracts Astro commands.

- [ ] Set up CLI package structure in `cli/`
- [ ] Use `citty` or `commander` for command parsing
- [ ] Use `@clack/prompts` for interactive prompts (beautiful terminal UI)
- [ ] Implement `lixent init` - Full interactive setup wizard
- [ ] Implement `lixent start` - Wraps `astro dev --port 3000`
- [ ] Implement `lixent generate` - Wraps `astro build`
- [ ] Implement `lixent themes` - List themes with descriptions
- [ ] Implement `lixent validate` - Parse and validate config
- [ ] Add fuzzy search for license picker (using `fuse.js` or similar)
- [ ] Add platform-specific deployment hints (GitHub Pages, GitLab Pages, etc.)
- [ ] Add `basePath` and `urlMode` handling in Astro config generation
- [ ] Register CLI binary in `package.json` `"bin"` field

**Deliverable:** `npx lixent init` creates a working config. `npx lixent start` previews it.

### Phase 5: Deployment Guides & Polish

**Goal:** Production-ready release with deployment guides.

- [ ] Create deployment guides for each platform:
  - GitHub Pages (with GitHub Actions workflow template)
  - GitLab Pages (with `.gitlab-ci.yml` template)
  - Cloudflare Pages
  - Netlify
  - Vercel
  - Custom server (nginx/caddy config examples)
- [ ] Generate deploy workflow files via CLI (`lixent init --deploy github`)
- [ ] Write comprehensive README.md
- [ ] Write CONTRIBUTING.md
- [ ] Set up GitHub Actions CI for the Lixent repo itself
- [ ] Performance audit (Lighthouse > 95)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Create demo deployment (GitHub Pages)
- [ ] Add tests (config parsing, license rendering, year formatting)

**Deliverable:** v1.0.0 release ready.

---

## 12. Deployment Guide

### GitHub Pages

**Setup:**
1. Fork or create repo named `username.github.io` (or any name)
2. Run `npx lixent init` to create config
3. Set `basePath: ""` for root, or `basePath: "/repo-name"` for subpath
4. Push to `main` branch

**GitHub Actions workflow** (generated by CLI):
```yaml
name: Deploy Lixent
on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: pnpm install
      - run: pnpm generate
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### GitLab Pages

```yaml
# .gitlab-ci.yml
pages:
  image: node:22
  script:
    - npm install -g pnpm
    - pnpm install
    - pnpm generate
  artifacts:
    paths:
      - public
  only:
    - main
```

### Cloudflare Pages

Connect repo. Set:
- Build command: `pnpm generate`
- Build output directory: `dist`

### Netlify / Vercel

Connect repo. Auto-detected.

### Custom Server

```bash
pnpm generate
# Copy dist/ to your web server's document root
scp -r dist/* user@server:/var/www/license/
```

Nginx example:
```nginx
server {
    listen 80;
    server_name license.example.com;
    root /var/www/license;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

---

## 13. Competitive Analysis

| Feature | mit-license.org | Lixent |
|---------|-----------------|--------|
| License types | 2 (MIT, ISC) | 15+ |
| Custom licenses | No | Yes |
| Themes | 121 (static CSS) | 10+ (CSS custom props) |
| Custom themes | Submit PR | User CSS file |
| Onboarding | GitHub PR | CLI + config file |
| Design | 2012 era | Modern, minimal |
| Deployment | Server only (hosted) | Static (self-hosted) |
| Custom domains | No (shared domain) | Yes (user controls DNS) |
| Runtime | Express.js server | Zero (static HTML) |
| Config | JSON files per user | Single JSON config |
| Year support | URL-based | Config-based |
| Plain text | Yes | Yes |
| JSON output | Yes | Yes |
| Gravatar | Yes | Yes |
| Dark themes | Yes | Yes |

---

## Summary

Lixent = mit-license.org's concept, modernized:
- **Every license**, not just MIT
- **Self-hosted** on any static platform
- **Beautiful themes** with CSS custom properties
- **User-friendly CLI** that hides build complexity
- **Custom domains** and subpath support
- **Zero runtime** - pure static HTML
