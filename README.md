# Lixent

Lixent generates a static HTML page displaying your software license. Users fork the repo, configure their identity once, and deploy to any static hosting platform. You control your own domain.

- Self-hosted — deploy to GitHub Pages, GitLab Pages, Cloudflare Pages, Netlify, Vercel, or your own server
- Every [SPDX License List](https://github.com/spdx/license-list-data) is supported
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

## Documentation

Full documentation is in the [Wiki](https://github.com/edgarcnp/lixent/wiki):

- [Configuration](https://github.com/edgarcnp/lixent/wiki/Configuration) — all fields, types, and examples
- [Custom Licenses](https://github.com/edgarcnp/lixent/wiki/Custom-Licenses) — inline text, file-based, placeholders
- [Themes](https://github.com/edgarcnp/lixent/wiki/Themes) — built-in themes, overrides, custom themes
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

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
