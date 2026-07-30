# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Non-standard Next.js version

This project pins `next@16.2.6`, a version well past this assistant's training data. APIs,
conventions, and file structure may differ from what you expect. **Before writing any Next.js
code, read the relevant guide in `node_modules/next/dist/docs/`** (organized into `01-app/`,
`02-pages/`, `03-architecture/`, `04-community/`). Heed any deprecation notices found there.

## Commands

Package manager is **pnpm** (see `pnpm-lock.yaml` / `pnpm-workspace.yaml`) — use `pnpm`, not
`npm`/`yarn`.

- `pnpm dev` — start the Next.js dev server
- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — run ESLint (flat config, `eslint.config.mjs`)
- `pnpm format` — format `**/*.{ts,tsx}` with Prettier
- `pnpm typecheck` — `tsc --noEmit`

There is no test runner configured in this repo.

### Adding UI components

This is a shadcn/ui project. Add new components with:

```bash
npx shadcn@latest add <component>
```

This places generated components under `components/ui`. Import via the `@/` alias, e.g.
`import { Button } from "@/components/ui/button"`.

**Do not hand-build UI or styled components from scratch.** Always use the default shadcn/ui
components (or another already-installed component library in this repo) instead of writing new
markup/CSS for things like buttons, dialogs, dropdowns, inputs, etc. Only build a component from
scratch if the user explicitly asks for it.

## Architecture

- Next.js **App Router** (`app/`). `app/layout.tsx` sets up fonts (Geist Mono + Inter) and wraps
  the app in `ThemeProvider`; `app/page.tsx` is the landing page.
- `components/ui/` holds shadcn/ui primitives. The shadcn style is **`base-luma`**
  (`components.json`), meaning primitives are built on **`@base-ui/react`**, not Radix — keep
  that in mind when adding/reading components or consulting shadcn docs/examples that assume
  Radix.
- `components/theme-provider.tsx` wraps `next-themes` and additionally installs a global `d`
  keydown hotkey that toggles light/dark theme (skipped while focus is in an input/textarea/
  select/contenteditable). This is custom, not part of stock shadcn/next-themes.
- Tailwind v4, configured via `app/globals.css` (no `tailwind.config.*` — see
  `components.json`'s `"tailwind.config": ""`). CSS variables are enabled; base color is `stone`.
- Path alias `@/*` maps to the repo root (`tsconfig.json`).
- shadcn aliases (`components.json`): `@/components`, `@/components/ui`, `@/lib`, `@/hooks`,
  `@/lib/utils`.

## Code style

- Prettier: no semicolons, double quotes, 2-space indent, `es5` trailing commas, 80-column width,
  Tailwind class sorting via `prettier-plugin-tailwindcss` (`cn`/`cva` calls are sorted too).
- ESLint enforces import/export ordering via `simple-import-sort` — don't hand-order imports.
- Custom naming-convention rules: hook names must start with `use` + camelCase; components must
  be PascalCase (JSX treats lowercase tags as native DOM elements).
- If a type is used in more than one file, extract it into its own standalone `.ts` file rather
  than leaving it inline or re-declaring it. Standalone TypeScript files (not components) are
  named lowercase, e.g. `lib/user.ts`, not `lib/User.ts`.
- Use `interface` when modeling an object shape that may be extended later. Use `type` for
  unions, intersections, primitives, tuples, or other flexible type composition.
- When combining or conditionally applying Tailwind classes, always go through `cn()`
  (`lib/utils.ts`, which wraps `clsx` + `tailwind-merge`) rather than template literals or manual
  string concatenation — it's what dedupes/overrides conflicting Tailwind classes correctly.
