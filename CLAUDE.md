# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`airovo-frame` — a pnpm + Turborepo monorepo for building a zero-config Vue 3 framework. Apps only need `@import "@airovo/uikit-shadcnui/style.css"`, extend the base tsconfig, and call `defineViteConfig()` — all path aliases, Tailwind scanning, and tooling live in the framework layer.

**Stack:** Vue 3 + Vite 8 + Tailwind 4 + shadcn-vue (reka-ui based). Iconography standardized on `@iconify/vue` via `@airovo/shared/icons`.

## Commands

Run from repo root.

| Command | What it does |
|---|---|
| `pnpm dev` | `turbo run dev` — starts all apps |
| `pnpm build` | `turbo run build` — builds all packages in dependency order |
| `pnpm lint` | `turbo run lint` — runs ESLint per package |
| `pnpm format` | `prettier --write "**/*.{ts,tsx,md}"` |

Single app/package:
- `pnpm --filter playwright dev` — dev server for the demo app
- `pnpm --filter @airovo/vite-config build` — rebuild the shared Vite config (**must rebuild after editing `src/config.ts`**, see gotcha below)
- `pnpm --filter @airovo/stores test` — run vitest for a single package
- `pnpm --filter @airovo/forms test` — run vitest for forms package
- `pnpm --filter @airovo/uikit-shadcnui exec shadcn-vue@latest add <component>` — add a shadcn-vue component

**Requires pnpm 9.15.4** (catalog protocol). Older pnpm will fail on `catalog:` specifiers.

## Architecture

```
apps/*                      ← user-facing apps (apps/playwright is the demo)
packages/core/*             ← framework-level packages
  app/                      ← createApp() factory — single entry point for business apps
  router/                   ← thin vue-router wrapper (menus + progress bar)
  layouts/                  ← BasicLayout / BasicHeader / BasicSidebar
  views/                    ← default Login/Register/Profile/NotFound/Redirect
  stores/                   ← auth / theme / i18n / preferences (Pinia + persist)
  forms/                    ← useAForm composable + <AForm> component (vee-validate + zod)
  config/                   ← Preferences type definitions
packages/ui-kit/shadcn-vue/ ← shadcn-vue components, source-consumed (NO build step)
packages/shared             ← icons (@iconify/vue re-export) + utils
packages/effects            ← third-party UI adapters (element-plus / naive-ui)
packages/design             ← design tokens + Demo showcase
app-ui                      ← business UI components (UserCard, StatCard, StatusBadge, ...)
internal/*
  vite-config/              ← defineViteConfig factory (built with tsup → consumed as dist)
  typescript-config/        ← base.json + vite.json, JSON configs (no build)
  eslint-config/            ← legacy .eslintrc-style config (ESLint 8)
  create-airovo-app/        ← CLI scaffolding tool (`pnpm create airovo-app`)
```

### Dependency direction (no cycles)

```
app → effects, layouts, router, stores, config, views, forms
layouts → stores, shared, uikit-shadcnui
views → uikit-shadcnui  (NOT stores — auth injected via route props)
forms → uikit-shadcnui, vee-validate, zod
effects → stores (types only)
design → uikit-shadcnui
app-ui → uikit-shadcnui
router → vue + vue-router only
shared → @iconify/vue
config → (nothing)
```

### Key conventions

**`createApp()` factory** (`packages/core/app/src/createApp.ts`)
- Business apps call `await createApp({ name, routeModules, auth, root, effects })` — the factory wires Pinia, i18n, Router, Preferences, auth guard, and optional effects adapters.
- `routeModules` accepts a glob map (apps call `import.meta.glob` at module level — Vite requires a static literal).
- `auth: { useStore: () => useAuthStore() }` enables the built-in route guard (checks `meta.public`, redirects to `/login` with `?redirect=...`).
- `effects: { adapters: ['element-plus'] }` opts into third-party UI library integration.
- `root: App` is required — pass the app's `App.vue` component.

**`defineViteConfig` factory** (`internal/vite-config/src/config.ts`)
- Apps call `export default defineViteConfig()` and the framework injects Vue + Tailwind + path aliases.
- Aliases: `#` → `apps/<name>/src`, `@` → `packages/ui-kit/shadcn-vue/src` (for shadcn-vue's internal `@/lib/utils`).
- **Built with tsup** — edits to `src/config.ts` require `pnpm --filter @airovo/vite-config build` before changes take effect in apps.

**Source-only ui-kit consumption**
- `packages/ui-kit/shadcn-vue/package.json` exports `.` → `./src/index.ts` directly. No build step; Vite bundles source straight into apps.
- App tsconfig strictness flows back into shadcn-vue source (template type errors surface during the app's `vue-tsc`).

**Tailwind scanning** (`packages/ui-kit/shadcn-vue/src/styles/globals.css`)
- `@import "tailwindcss"` then `@source` directives scan the workspace. Path depth: `../../../../core` reaches `packages/core`.
- Apps only need `@import "@airovo/uikit-shadcnui/style.css";` once.

**pnpm catalog**
- `pnpm-workspace.yaml` catalogs shared versions. Package manifests reference these as `"<dep>": "catalog:"`.

**Effects adapters** (`packages/effects/src/adapters/`)
- Element Plus and Naive UI are **optional peer dependencies** — apps install them themselves.
- Adapters use `new Function('m', 'return import(m)')(mod)` to dynamically load, avoiding Vite's static import analysis (which would fail if the package isn't installed).

**Views decoupled from stores**
- `@airovo/views` (Login/Register/Profile) do NOT import `@airovo/stores`. Auth functions are injected via route `props` — business apps pass `useAuthStore()` methods through route config. This breaks what would otherwise be a circular dependency (views → stores → config → router → views).

**Form system** (`packages/core/forms/`)
- `useAForm(schema)` wraps vee-validate + zod. `schema.fields` describes field layout; `schema.validation` is a Zod schema.
- `<AForm>` component auto-renders fields from the schema, with named-slot overrides per field.
- Preset factories: `createLoginSchema()`, `createRegisterSchema()`, `createChangePasswordSchema()`.

### Business app structure (minimal)

```
apps/my-app/src/
  main.ts          ← createApp({ routeModules, auth, root }) + mount('#app')
  App.vue          ← BasicLayout + RouterView (conditional on meta.ignoreLayout)
  router/
    routes.ts      ← import.meta.glob('./routes/modules/*.ts')
    routes/modules/
      auth.ts      ← login/register/profile routes
      dashboard.ts ← business routes
  views/
    Login.vue      ← custom or import from @airovo/views
    ...
```

## Layout / scrolling pattern (load-bearing)

`BasicLayout` uses a vertical `SidebarProvider` with sticky header + content area. The height chain **must** be locked at the top for `ScrollArea` to be the single scroll container:

```
<div class="h-svh overflow-hidden [--header-height:...]">   ← lock root height
  <SidebarProvider class="flex h-full flex-col">             ← inherit height
    <BasicHeader />
    <div class="flex flex-1 min-h-0">                        ← min-h-0 is critical
      <BasicSidebar />
      <SidebarInset>
        <main class="flex min-h-0 flex-1 flex-col">
          <ScrollArea class="flex-1 min-w-0 min-h-0 overflow-x-hidden">
```

Rules: scrolling element needs an ancestor with fixed height (`h-svh`, not `min-h-svh`); every `flex-1` item needs `min-h-0`/`min-w-0`; add `overflow-x-hidden` on ScrollArea to suppress horizontal scroll.

## Known gotchas

- **`@` alias collision** — the factory sets `@` → `shadcn-vue/src` for its internal `@/lib/utils`. Apps must **not** override `@` in their `vite.config.ts`; use `#` for app src (already provided). The demo app's `vite.config.ts` currently does NOT override `@` (correct).
- **`vite-config` rebuild required** — `internal/vite-config` is built with tsup. After editing `src/config.ts`, run `pnpm --filter @airovo/vite-config build` or changes won't take effect.
- **`shadcn-vue/package.json`** still lists three legacy icon libs (`@lucide/vue`, `lucide-vue-next`, `@radix-icons/vue`) alongside the standardized `@iconify/vue` — cleanup target.
- **`optimizeDeps.exclude`** in `vite-config` lists 5 packages but is missing newer ones (`@airovo/app`, `@airovo/forms`, `@airovo/views`, `@airovo/design`). May cause Vite dep-scan warnings for packages without adjacent `tsconfig.json`.
