# Lixent

Lixent generates a static HTML page displaying your software license. Fork the repo, configure your identity once, and deploy to any static hosting platform.

- Self-hosted — deploy to GitHub Pages, GitLab Pages, Cloudflare Pages, Netlify, Vercel, or your own server
- Every [SPDX License List](https://github.com/spdx/license-list-data) license
- 16 built-in themes, from Paper and Solarized to Dracula, Nord, and Terminal
- Custom license text support (inline or file-based)
- Theme presets with color overrides, custom CSS files, and Google Fonts
- Gravatar integration
- No server runtime and no runtime dependencies

## Quick Start

1. Fork this repository
2. Edit `lixent.config.json` with your information
3. Deploy to your hosting platform

```json
{
    "$schema": "./lixent.schema.json",
    "copyright": "Your Name",
    "url": "https://yoursite.com",
    "email": "you@example.com",
    "license": "MIT",
    "theme": {
        "preset": "minimal"
    }
}
```

4. Push to deploy (GitHub Actions workflow included)

Editors use `lixent.schema.json` for autocomplete and inline validation in `lixent.config.json`.

### Common options

| Key | Purpose |
|---|---|
| `license` | SPDX id (e.g. `"Apache-2.0"`, `"GPL-3.0-only"`) or `"custom"` |
| `theme.preset` | Built-in theme id (e.g. `"github-dark"`) or an absolute CSS path (`"/my-theme.css"`) |
| `theme.colors` | Override `bg`, `text`, `textMuted`, `accent`, `border` on top of the preset |
| `theme.font` | Google Fonts family name (e.g. `"Inter"`) |
| `year` / `yearRange` | Override the copyright year; mutually exclusive |
| `licenseFile` | Relative path to a custom license text file (with `"license": "custom"`) |
| `basePath` | Subpath deployments (e.g. `"/license"`) |

## Documentation

Full documentation is in the [Wiki](https://github.com/edgarcnp/lixent/wiki):

- [Configuration](https://github.com/edgarcnp/lixent/wiki/Configuration) — all fields, types, and examples
- [Custom Licenses](https://github.com/edgarcnp/lixent/wiki/Custom-Licenses) — inline text, file-based, placeholders
- [Themes](https://github.com/edgarcnp/lixent/wiki/Themes) — built-in themes, color overrides, custom CSS
- [Error Handling](https://github.com/edgarcnp/lixent/wiki/Error-Handling) — error codes, catching, common messages
- [Deployment](https://github.com/edgarcnp/lixent/wiki/Deployment) — all platforms with server configs
- [Contributing](https://github.com/edgarcnp/lixent/wiki/Contributing) — project structure, conventions, AI usage

## Development

```bash
bun install
bun dev         # Start dev server
bun run build   # Build for production
bun run lint    # Run ESLint
bun test        # Run tests
bun run cq      # Lint + typecheck + test
```

The whole pipeline is `loadConfig()` → `buildPage()` → one resolved `PageModel` → an Astro layout that renders it. Domain logic lives in `src/core` with injectable I/O; see [AGENTS.md](AGENTS.md) for the architecture.

## Demo

The interactive demo (theme gallery, font picker, live license preview) lives in this repo and is built only when `LIXENT_DEMO=1`:

```bash
LIXENT_DEMO=1 bun dev     # http://localhost:4321/demo
LIXENT_DEMO=1 bun run build
```

Demo builds also fetch the Google Fonts catalog into `public/fonts.json` and copy your config for the demo to load. Default builds are unaffected: no demo route, no extra network calls. The included GitHub Pages workflow builds with the flag enabled.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
