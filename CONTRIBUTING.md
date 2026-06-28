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

## AI Usage Policy

### The Critical Rule

You must understand your code. If you can't explain what your changes do and how they interact with the rest of the codebase without the aid of AI tools, do not contribute to this project.

Using AI to write code is fine. You can gain understanding by interrogating an agent with access to the codebase until you grasp all edge cases and effects of your changes. What's not fine is submitting agent-generated code without that understanding.

### Guidelines

- **Read and understand every line** you submit. If an AI tool generated it, review it line by line before committing.
- **Be able to explain your changes** in the PR description without copy-pasting AI output. If asked "why did you do it this way?", you should have a real answer.
- **Run the test suite** (`bun run cq`) on every change. Don't trust that AI-generated code works — verify it.
- **Know the security model.** Lixent sanitizes user input for CSS injection and XSS. If your change touches user-facing input, you must understand why the existing guards exist and whether your change needs new ones.
- **Don't submit slop.** Bulk-generated code that doesn't account for project conventions, error handling patterns, or the existing module structure will be rejected.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
