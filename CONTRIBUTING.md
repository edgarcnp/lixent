# Contributing to Lixent

Thank you for your interest in contributing to Lixent! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Start the dev server:
   ```bash
   pnpm dev
   ```

## Development

### Project Structure

```
├── src/
│   ├── components/     # Astro components
│   ├── data/          # License JSON files (generated)
│   ├── layouts/       # Page layouts
│   ├── lib/           # Core utilities (config, types, gravatar, year)
│   ├── licenses/      # License registry
│   ├── pages/         # Route pages
│   ├── styles/        # CSS files
│   └── themes/        # Theme CSS files and registry
├── public/            # Static assets
├── scripts/           # Build scripts
└── dist/              # Build output
```

### Commands

```bash
pnpm dev        # Start dev server at localhost:4321
pnpm build      # Build for production
pnpm preview    # Preview build locally
pnpm lint       # Run ESLint
pnpm lint:fix   # Auto-fix lint issues
```

### Adding a Theme

1. Create a new CSS file in `src/themes/` (e.g., `my-theme.css`)
2. Define all required CSS custom properties (see `src/themes/minimal.css` for reference)
3. Add the theme to `src/themes/index.ts`
4. Copy the CSS file to `public/themes/`
5. Test with `"theme": "my-theme"` in your config

### Adding a License

1. Add the license text to `src/data/licenses/` as a JSON file
2. Update `src/licenses/index.ts` to import and register the license
3. Use `{{year}}`, `{{name}}`, `{{url}}`, `{{email}}` as placeholders

### Updating License Data

Run the SPDX fetch script to update all license texts:

```bash
npx tsx scripts/fetch-spdx.ts
```

## Code Style

- TypeScript with strict type checking
- ESLint with `strictTypeChecked` and `stylisticTypeChecked`
- No Tailwind CSS — use CSS custom properties
- No semicolons
- Double quotes

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Run `pnpm lint` and `pnpm build` to verify
4. Submit a pull request

### PR Guidelines

- Keep changes focused and minimal
- Add a clear description of what changed and why
- Update documentation if needed
- Test your changes locally before submitting

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Include steps to reproduce for bugs
- Specify your Node.js version and package manager

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
