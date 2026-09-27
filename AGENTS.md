# AGENTS.md

This file is read by AI agents (Claude, Cursor, Copilot, etc.) to produce higher-quality contributions to Lixent.

## What Lixent Is

A static license page generator built with Astro 7. Users configure their identity in `lixent.config.json`, and Lixent generates a single HTML page displaying their software license. Think mit-license.org but self-hosted, with themes and every SPDX license.

## Critical Architecture

```
Raw JSON → loadConfig() → buildPage() → PageModel → Astro layout
```

- **Build-time only.** No server runtime. The only network request in a default build is fetching SPDX license data; demo builds (`LIXENT_DEMO=1`) additionally fetch the font catalog and copy the config for the demo.
- **Pure core, thin adapter.** `src/core` has no Astro imports and no I/O at import time. `src/site` (Astro's `srcDir`) renders a fully resolved `PageModel` and contains no domain logic.
- **Config has one owner.** `parseConfig()` in `src/core/config/fields.ts` is the only place that knows config keys. It rejects unknown keys and reports every problem at once.
- **I/O is injected.** `buildPage(config, deps)` accepts `root`, `now`, `readFile`, `fetchImpl`, `spdx`, and `gravatarUrl` overrides so tests never touch the network, the clock, or the filesystem.

## Project Structure

```
src/
├── core/                    # Pure, testable domain code (no Astro)
│   ├── config/
│   │   ├── types.ts         # LixentConfig and friends
│   │   ├── fields.ts        # Key registry, parsing, every diagnostic
│   │   └── loader.ts        # Filesystem edge: loadConfig()
│   ├── license/
│   │   ├── id.ts            # SPDX id grammar
│   │   ├── placeholders.ts  # SPDX dialects → canonical {{year}} / {{name}}
│   │   ├── render.ts        # Single-pass substitution
│   │   └── resolve.ts       # Custom + SPDX resolution with injected I/O
│   ├── theme/
│   │   ├── catalog.ts       # 16 themes as data; THEME_VARIABLES
│   │   ├── font.ts          # Google Fonts URL generation
│   │   └── style.ts         # resolveStyle() → <html> style attribute
│   ├── page/build.ts        # buildPage() → PageModel
│   ├── diagnostics.ts       # ConfigError, LicenseError, code unions
│   ├── sanitize.ts          # hasHtmlTags, hasCssDangerous, stripCssUrl
│   ├── year.ts              # formatYear, formatYearRange
│   └── gravatar.ts          # SHA-256 email hash → Gravatar URL
├── site/                    # Astro adapter (configured as srcDir)
│   ├── views/LicensePage.astro  # license page (injected at / or /license)
│   ├── layouts/LicenseLayout.astro
│   ├── components/LicenseView.astro  # document: identifier chip, identity, body
│   ├── components/ui/       # demo-only Astro components
│   ├── demo/                # demo client: page.astro + browser modules
│   └── styles/base.css      # base.css, plus demo.css for the demo shell
└── env.d.ts
tests/                       # bun test, node:test style
lixent.schema.json           # JSON Schema, kept in sync by tests
lixent.config.json
```

## Error Handling

Every user-facing failure throws `ConfigError` or `LicenseError`:

```ts
catch (error) {
    if (error instanceof ConfigError) {
        error.diagnostics  // [{ code, field?, message }, ...] — every problem, not just the first
    }
    if (error instanceof LicenseError) {
        error.code       // INVALID_ID, FETCH_FAILED, NOT_FOUND, MISSING_TEXT, FILE_UNREADABLE
        error.licenseId
    }
}
```

- Codes are literal unions in `diagnostics.ts`; keep them in sync with the wiki's error tables.
- Error constructors prefix each message with `[lixent]`; diagnostic messages themselves do not carry it.
- Never throw bare `Error` for user-facing failures.
- JSDoc `@throws` must name `{ConfigError}` or `{LicenseError}`.

## Security Model

Two layers: validation rejects bad input at parse time; `sanitize.ts` neutralizes anything that still reaches rendering.

1. **CSS injection** via theme colors, fonts, and metrics. `hasCssDangerous()` rejects `;`, `{`, `}`, and `url(`; `resolveStyle()` applies `stripCssUrl()` as a render-time net. Resolved values become declarations in the `<html style>` attribute — never a raw CSS block.
2. **XSS** via `copyright` or `customLicense.name`. `hasHtmlTags()` rejects tags; all rendered text goes through Astro expressions (auto-escaped). There is no `set:html` anywhere; keep it that way.
3. **URL schemes.** Only `http:` and `https:` are accepted for `url`.
4. **Path traversal.** `licenseFile` must stay a relative path inside the project; absolute paths, drive letters, and `..` segments are rejected.

## Config Module

- `fields.ts` owns per-field parsing, the `CONFIG_KEYS` / `THEME_KEYS` allowlists, cross-field rules, and defaults.
- Unknown keys are errors; `$schema` is the only ignored key.
- `loadConfig()` reads `lixent.config.json` (or an explicit `configPath`); there is no `package.json` fallback.
- Defaults: `gravatar: false`, `theme.preset: "minimal"`. `copyright` and `license` are required.
- `lixent.schema.json` must stay in sync; `tests/schema.test.ts` fails when keys drift.

## License Module

- Placeholder conversion is a table in `placeholders.ts`; rendering is single-pass with a callback in `render.ts`. Never use `replace(pattern, string)` — replacement patterns like `$&` would be reinterpreted.
- `resolveLicense()` resolves custom text/file or SPDX. For SPDX it fetches the list first, so an unknown id reports `NOT_FOUND` instead of a 404-driven `FETCH_FAILED`.
- `licenseFile` resolves against the injected `root`, never `process.cwd()` directly.
- The SPDX list is memoized per `SpdxClient`; tests inject fakes instead of hitting the network.

## Theme System

- Themes are data in `catalog.ts`; there are no per-theme CSS files. Every theme defines the six `--lx-*` variables.
- `theme.preset` is a built-in id or an absolute CSS path. There is no `"custom"` sentinel; `theme.colors` overrides preset colors.
- `resolveStyle()` merges preset → colors → typography and returns declarations plus optional font/theme hrefs.
- `THEME_COLOR_VARIABLES` is the only mapping from semantic color keys to CSS variables (the old `border` → `--lx-divider` trap).

## Page Pipeline

`buildPage()` is the only composition point: year resolution (injectable clock), license resolution, text rendering, identity/gravatar, and style. It returns `PageModel`. Astro files render props only — never branch on config in a template.

Paragraphs are classified (`body` vs `heading`) and a leading paragraph that repeats the license name is dropped, so `LicenseView` renders structure without parsing text. Keep classification presentation-only: never alter the license text itself.

## Build & Deployment

- `astro.config.mjs` sets `srcDir: "./src/site"` and `base` from `config.basePath`.
- Deploy workflows pass `--site` / `--base` for GitHub Pages; GitLab Pages and other hosts build at the root.
- The GitHub Pages workflow builds with `LIXENT_DEMO=1`, so the deployed site serves the demo at `/` and `/demo`, with the license page at `/license`.

## Demo

- `LIXENT_DEMO=1` makes the demo the root: `/` and `/demo` render `src/site/demo/page.astro`, and the license page moves to `/license`. The font catalog is fetched into `public/fonts.json` (best effort: a failed fetch only empties the font picker), and the config is copied to `public/lixent.config.json` for the demo to load.
- Default builds inject only `/` → `src/site/views/LicensePage.astro`; no demo routes and no demo-only network calls.
- Demo client modules under `src/site/demo/` may import pure core modules only: `theme/catalog.ts`, `theme/style.ts`, `theme/font.ts`, `license/render.ts`, `paragraphs.ts`, `gravatar.ts`, and `config/types.ts`. Never import `license/resolve.ts` or `config/loader.ts` into client code — they pull in `node:fs`.
- The preview applies `resolveStyle().declarations` to its DOM element and resolves the same config shape the real page uses (`buildPreviewConfig`), and it renders the same classified paragraphs and identity markup as `LicenseView`, so preview and production cannot drift.

## Conventions

- No semicolons. Double quotes. 4-space indent. Trailing commas in multiline literals.
- ESLint `strictTypeChecked` + `stylisticTypeChecked`; run `bun run cq` before committing.
- All user-facing messages start with `[lixent]` (added by the error constructors).
- Keep `src/core` free of Astro imports so it stays unit-testable.
- Prefer early returns and narrow values; never use type assertions to paper over unparsed input.

## Testing

- `bun test` runs 137 tests across 12 files (`node:test` style with `node:assert/strict`).
- Tests inject fakes for fetch, clock, and filesystem. Do not add tests that hit the network.
- `tests/schema.test.ts` guards schema/parser drift; `tests/settings.test.ts` guards the demo's config serialization; `tests/paragraphs.test.ts` guards paragraph classification.
- Regression tests worth keeping: `$&` replacement patterns, root-relative `licenseFile`, `NOT_FOUND` before text fetch, aggregated diagnostics, and unknown-key rejection.

## Common Pitfalls

- `theme` is an object now; `"theme": "minimal"` is invalid.
- `page.head.style` is an `<html style>` attribute value, not a `<style>` block; do not wrap it in `set:html`.
- Year resolution uses `deps.now`; do not call `new Date()` inside `buildPage` paths that tests exercise.
- Adding a config key means updating `fields.ts`, `lixent.schema.json`, and tests.
- Do not re-add `public/themes/*.css`, a `"custom"` theme sentinel, or `themeOverrides`/`customTheme`; `theme.colors` is the single override mechanism.
- Demo client code must stay clear of server-only core modules (`license/resolve.ts`, `config/loader.ts`); importing them breaks the browser bundle.
- Routes are injected by `astro.config.mjs`, not file-based: there is no `src/site/pages/`. Add routes with `injectRoute` and keep page components under `src/site/views/`.
