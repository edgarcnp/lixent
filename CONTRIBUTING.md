# Contributing to Lixent

Thank you for your interest in contributing to Lixent! This document provides guidelines and information for contributors.

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
│   │   ├── validation.ts # Input validators
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
- Specify your Bun version

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
