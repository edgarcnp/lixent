# Lixent

A modern, self-hosted license page generator. Like [mit-license.org](https://mit-license.org) but for every license, with beautiful themes.

## What is Lixent?

Lixent generates a static HTML page displaying your software license. Users fork the repo, configure their identity once, and deploy to any static hosting platform. You control your own domain.

**Key differences from mit-license.org:**
- Self-hosted — deploy to GitHub Pages, GitLab Pages, Cloudflare Pages, Netlify, Vercel, or your own server
- Every SPDX license supported, not just MIT
- 10 built-in themes with light/dark variants
- Custom license text support (inline or file-based)
- Custom theme support (inline JSON or external CSS)
- Font customization via Google Fonts
- Gravatar integration

## Quick Start

1. Fork this repository
2. Edit `lixent.config.json` with your information
3. Deploy to your hosting platform

```json
{
  "copyright": "Your Name",
  "url": "https://yoursite.com",
  "email": "you@example.com",
  "license": "MIT",
  "theme": "minimal"
}
```

4. Push to deploy (GitHub Actions workflow included)

## Configuration

All configuration is in `lixent.config.json` (or the `"lixent"` field in `package.json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `copyright` | string | Yes | Your name or organization |
| `license` | string | Yes | SPDX license ID or `"custom"` |
| `theme` | string | Yes | Theme ID, `"custom"`, or path to custom CSS |
| `url` | string | No | Your website URL |
| `email` | string | No | Email for Gravatar |
| `gravatar` | boolean | No | Show Gravatar avatar |
| `font` | string | No | Google Fonts family name (e.g. `"Inter"`) |
| `fontSize` | string | No | CSS font-size (e.g. `"1.125rem"`, `"18px"`) |
| `fontWeight` | string | No | CSS font-weight (e.g. `"400"`, `"700"`) |
| `lineHeight` | string | No | CSS line-height (e.g. `"1.7"`, `"1.5"`) |
| `letterSpacing` | string | No | CSS letter-spacing (e.g. `"0.025em"`) |
| `customLicense` | object | No | Custom license config (when `license: "custom"`) |
| `licenseFile` | string | No | Path to license text file (when `license: "custom"`) |
| `customTheme` | object | No | Inline custom theme colors (when `theme: "custom"`) |
| `basePath` | string | No | For subpath deploys (e.g. `"/license"`) |
| `themeOverrides` | object | No | Override CSS custom properties |
| `year` | number | No | Override copyright year |
| `yearRange` | object | No | Use year range instead of single year |

### Custom License

**Inline text:**

```json
{
  "license": "custom",
  "customLicense": {
    "name": "My Custom License",
    "text": "Copyright (c) {{year}} {{name}}\n\nPermission is hereby granted..."
  }
}
```

**File-based:**

```json
{
  "license": "custom",
  "licenseFile": "LICENSE.txt"
}
```

The file is read at build time and supports the same placeholders: `{{year}}`, `{{name}}`, `{{url}}`, `{{email}}`. If both `customLicense.text` and `licenseFile` are set, `licenseFile` takes precedence.

### Font Customization

Use any Google Fonts family:

```json
{
  "font": "Merriweather",
  "fontSize": "1.125rem",
  "fontWeight": "700"
}
```

### Theme Overrides

Override any CSS custom property without creating a full theme:

```json
{
  "theme": "minimal",
  "themeOverrides": {
    "--lx-bg": "#1a1a1a",
    "--lx-text": "#e5e5e5",
    "--lx-accent": "#60a5fa",
    "--lx-text-muted": "#a3a3a3",
    "--lx-divider": "#404040"
  }
}
```

### Year and YearRange

By default, the current year is used. Override it:

```json
{
  "year": 2025
}
```

Or use a year range:

```json
{
  "yearRange": { "start": 2020, "end": 2025 }
}
```

**Note:** `year` and `yearRange` are mutually exclusive — setting both throws an error.

## Available Themes

| Theme | Description | Dark |
|-------|-------------|------|
| `minimal` | Clean sans-serif, generous spacing | No |
| `minimal-dark` | Same as minimal, dark background | Yes |
| `github` | GitHub README aesthetic | No |
| `github-dark` | GitHub dark README | Yes |
| `terminal` | Retro green-on-black | Yes |
| `newspaper` | NYT/journalism style | No |
| `elegant` | High-contrast, refined | No |
| `mono` | Pure monospace, no decoration | No |
| `serif` | Traditional book-like | No |
| `sans` | Modern sans-serif | No |

### Custom Themes

**Inline JSON (simple):**

```json
{
  "theme": "custom",
  "customTheme": {
    "bg": "#1a1a1a",
    "text": "#e5e5e5",
    "textMuted": "#a3a3a3",
    "accent": "#60a5fa",
    "border": "#404040"
  }
}
```

**External CSS file (advanced):**

Create a CSS file defining all required custom properties:

```css
:root {
  --lx-bg: #ffffff;
  --lx-text: #1a1a1a;
  --lx-text-muted: #666666;
  --lx-accent: #2563eb;
  --lx-divider: #e5e7eb;
  --lx-font-body: "Inter", system-ui, sans-serif;
}
```

Reference it in your config:

```json
{
  "theme": "./my-theme.css"
}
```

## Deployment

### GitHub Pages (Recommended)

1. Fork this repo
2. Edit `lixent.config.json`
3. Push to `main`

The included GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically build and deploy.

### GitLab Pages

1. Fork this repo
2. Edit `lixent.config.json`
3. Push to `main`

The included `.gitlab-ci.yml` will handle the build.

### Cloudflare Pages

1. Connect your repo to Cloudflare Pages
2. Set build command: `bun run build`
3. Set build output directory: `dist`

### Netlify / Vercel

1. Connect your repo
2. Auto-detected — no configuration needed

### Custom Server

```bash
bun run build
scp -r dist/* user@server:/var/www/license/
```

Nginx config:

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

## Development

```bash
bun install
bun dev         # Start dev server
bun run build   # Build for production
bun run lint    # Run ESLint
bun test        # Run tests
bun run cq      # Lint + typecheck + test
```

## Tech Stack

- [Astro 7](https://astro.build) — Static site generation
- TypeScript — Type safety
- CSS Custom Properties — Theme system
- [SPDX License List](https://github.com/spdx/license-list-data) — License texts

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
