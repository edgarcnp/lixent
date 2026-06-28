# Contributing to Lixent

Thank you for your interest in contributing to Lixent! This document provides guidelines and information for contributors.

## AI Usage Policy

Lixent has strict rules for AI usage. Please see [AI_POLICY.md](AI_POLICY.md) for the full policy.

The most important rule: **you must understand your code.** If you can't explain what your changes do and how they interact with the rest of the codebase without the aid of AI tools, do not contribute to this project.

## AI and Agents

If you're using AI assistance with Lixent, Lixent provides an
[AGENTS.md file](https://github.com/edgarcnp/lixent/blob/main/AGENTS.md)
read by most of the popular AI agents to help produce higher quality
results.

> [!WARNING]
>
> All AI assistance usage must be disclosed
> and we expect contributors to understand the code that is produced and
> be able to answer questions about it. If you don't understand the
> code produced, feel free to disclose that, but if it has problems, we
> may ask you to fix it and close the issue. It isn't a maintainers job to
> review a PR so broken that it requires significant rework to be acceptable.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies:
   ```bash
   bun install
   ```
4. Start the dev server:
   ```bash
   bun dev
   ```

## Development

### Project Structure

```
├── src/
│   ├── components/     # Astro components (LicenseBody)
│   ├── layouts/        # Page layouts (LicenseLayout)
│   ├── lib/            # Core utilities
│   │   ├── config/     # Config loading (coercion, validation, loader)
│   │   ├── errors.ts   # ConfigError, LicenseError classes
│   │   ├── font.ts     # Google Fonts URL generation
│   │   ├── gravatar.ts # Gravatar URL generation
│   │   ├── license.ts  # License fetching and rendering
│   │   ├── types.ts    # LixentConfig interface
│   │   ├── validators.ts # Input validators
│   │   ├── constants.ts  # Shared validation constants
│   │   ├── sanitize.ts   # Input sanitization helpers
│   │   └── year.ts     # Year formatting
│   ├── pages/          # Route pages (index.astro)
│   ├── styles/         # CSS files (base.css)
│   └── themes/         # Theme registry (index.ts)
├── public/             # Static assets (theme CSS files, favicons)
├── tests/              # Test files
└── dist/               # Build output
```

### Commands

```bash
bun dev         # Start dev server at localhost:4321
bun run build   # Build for production
bun run preview # Preview build locally
bun run lint    # Run ESLint
bun run lint:fix # Auto-fix lint issues
bun test        # Run tests
bunx tsc --noEmit  # Type check
bun run cq      # Lint + typecheck + test (all-in-one)
```

### Adding a Theme

1. Create a new CSS file in `public/themes/` (e.g., `my-theme.css`)
2. Define all 6 required CSS custom properties (`--lx-bg`, `--lx-text`, `--lx-text-muted`, `--lx-accent`, `--lx-divider`, `--lx-font-body`)
3. Add the theme to `src/themes/index.ts`
4. Test with `"theme": "my-theme"` in your config

## Code Style

- TypeScript with strict type checking
- ESLint with `strictTypeChecked` and `stylisticTypeChecked`
- No Tailwind CSS — use CSS custom properties
- No semicolons
- Double quotes
- 4-space indent
- All errors use `[lixent]` prefix and throw `ConfigError` or `LicenseError`

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Run `bun run cq` to verify (lint + typecheck + test)
4. Submit a pull request

### PR Guidelines

- Keep changes focused and minimal
- Add a clear description of what changed and why
- Update documentation if needed
- Test your changes locally before submitting

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Include steps to reproduce for bugs
- Specify your Bun and Lixent version

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
