# AGENTS.md

This file is read by AI agents (Claude, Cursor, Copilot, etc.) to produce higher-quality contributions to Lixent.

## What Lixent Is

A static license page generator built with Astro 7. Users configure their identity in `lixent.config.json`, and Lixent generates a single HTML page displaying their software license. Think mit-license.org but self-hosted, with themes and every SPDX license.

## Critical Architecture

```
User config → loadConfig() → resolveLicense() → renderLicenseText() → Astro template
```

- **Build-time only.** No server runtime. All network requests (SPDX list, Google Fonts catalog) happen at build time.
- **Config is the source of truth.** `LixentConfig` in `src/lib/types.ts` defines every field.
- **Security is validation-first.** All user input is validated at config load time (`validators.ts`) and sanitized again at render time (`sanitize.ts`). Never trust user input.

## Project Structure

```
src/
├── components/LicenseBody.astro   # Renders license text as paragraphs
├── layouts/LicenseLayout.astro    # HTML shell, CSS injection, Gravatar
├── lib/
│   ├── config/
│   │   ├── coercion.ts    # String→number year coercion
│   │   ├── validator.ts   # Orchestrates all assert* validators
│   │   ├── loader.ts      # Reads config files, applies defaults
│   │   └── index.ts       # Re-exports loadConfig
│   ├── constants.ts       # MAX_*, ALLOWED_SCHEMES, CSS_VALUE_PATTERN, CUSTOM_THEME_KEYS
│   ├── errors.ts          # ConfigError (code+field), LicenseError (code+licenseId)
│   ├── font.ts            # Google Fonts URL generation
│   ├── gravatar.ts        # SHA-256 email hash → Gravatar URL (async)
│   ├── license.ts         # SPDX fetch, placeholder conversion, rendering
│   ├── sanitize.ts        # hasHtmlTags, hasCssUrl, stripCssUrl
│   ├── types.ts           # LixentConfig interface
│   ├── validators.ts      # 10 assert* functions
│   └── year.ts            # formatYear, formatYearRange
├── pages/index.astro      # 30 lines — orchestrates config→license→render
├── styles/base.css        # Layout, typography, responsive
└── themes/index.ts        # Theme registry, THEME_VARIABLES, getTheme, isValidTheme
```

## Error Handling

Every user-facing error throws `ConfigError` or `LicenseError`. Both carry structured data:

```ts
// ConfigError: validation/coercion/loading failures
catch (e) {
    if (e instanceof ConfigError) {
        e.code   // EMPTY_FIELD, TOO_LONG, INVALID_FORMAT, HTML_TAGS, UNSAFE_VALUE, ...
        e.field  // "copyright", "theme", "customLicense.name", ...
    }
}

// LicenseError: license fetch/resolve failures
catch (e) {
    if (e instanceof LicenseError) {
        e.code       // FETCH_FAILED, NOT_FOUND, INVALID_ID, MISSING_TEXT
        e.licenseId  // "MIT", "GPL-3.0-only", ...
    }
}
```

- All error messages start with `[lixent]` prefix.
- Never use bare `throw new Error(...)`. Always use `ConfigError` or `LicenseError`.

## Security Model

Lixent is a static site generator. Attack surface:

1. **CSS injection** via `themeOverrides`, `font`, `customTheme`. Mitigated by `hasCssUrl()` (blocks `url()`) and `stripCssUrl()` at render time.
2. **XSS via copyright/license text**. Mitigated by `hasHtmlTags()` (blocks `<script>` etc.) and Astro's HTML escaping.
3. **URL scheme abuse**. Mitigated by `assertValidUrl()` (allows only `http:`/`https:`).

Sanitization is two-layer: validation rejects bad input at load time, `sanitize.ts` strips anything that slips through at render time.

## Theme System

- 10 built-in themes. CSS files in `public/themes/{id}.css`.
- Each theme defines 6 CSS variables: `--lx-bg`, `--lx-text`, `--lx-text-muted`, `--lx-accent`, `--lx-divider`, `--lx-font-body`.
- `THEME_VARIABLES` in `themes/index.ts` is the allowlist for `themeOverrides`.
- Custom themes: `"theme": "custom"` + `customTheme` object (5 color keys: `bg`, `text`, `textMuted`, `accent`, `border`).
- `CUSTOM_THEME_MAP` in `LicenseLayout.astro` maps `border` → `--lx-divider` (not `divider` — the config field is `border`).

## Config Module

Split into 3 files by concern:
- `coercion.ts` — String→number year coercion via `coerceYear()` helper
- `validator.ts` — Orchestrates all `assert*` validators
- `loader.ts` — File reading, `loadConfig()`, `loadFromPackageJson()`

Config priority: `lixent.config.json` → `package.json` "lixent" field → defaults.

## License Module

- `resolveLicense(config)` handles custom (inline/file) and SPDX licenses. Returns `{ name, text }`.
- SPDX licenses fetched from GitHub raw content. 15s timeout.
- 12 SPDX placeholder patterns normalized to `{{year}}` / `{{name}}` canonical form.
- `renderLicenseText()` substitutes canonical placeholders with user values.

## Conventions

- No semicolons. Double quotes. 4-space indent.
- ESLint with `strictTypeChecked` + `stylisticTypeChecked`. Run `bun run cq` before committing.
- All errors use `[lixent]` prefix.
- JSDoc `@throws` must specify `{ConfigError}` or `{LicenseError}`, not `{Error}`.
- No hardcoded values — theme registry auto-generated from CSS files, preview colors parsed from vars.
- Inputs use `placeholder` for defaults, not `value`. Config JSON only includes user-set values.
- `year` and `yearRange` are mutually exclusive — both throws an error.
- `customTheme.border` maps to `--lx-divider` (the CSS var was renamed but the config field kept its name).
- `getGravatarUrl()` is async (uses `crypto.subtle.digest` for SHA-256).
- `resolveLicense()` is async (network fetch for SPDX). `loadConfig()` is sync.

## Testing

- 134 tests across 10 files using Node's built-in `node:test`.
- Run `bun run cq` (lint + typecheck + test) before any commit.
- Tests import from public API only (no testing internals that were de-exported).

## Common Pitfalls

- `CUSTOM_THEME_MAP` key is `"border"` (not `"divider"`). The CSS var is `--lx-divider`.
- `CSS_DANGEROUS_PATTERN` was removed. Use `hasCssUrl()` from `sanitize.ts` instead.
- `validation.ts` was split into `constants.ts` + `validators.ts` + `sanitize.ts`.
- `getLicenseName()` was removed (dead code). Use `resolveLicense()` instead.
- `GoogleFont` interface was removed (dead code).
- `SPDX_LIST_URL` / `SPDX_TEXT_BASE` are not exported (internal constants).
- Font catalog is fetched from `fonts-data` branch via raw GitHub URL (no API key at runtime).
