# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`airovo-frame` — a personal learning monorepo for building a zero-config Vue 3 framework (pnpm workspaces + Turborepo). Goal: apps only need `@import "@airovo/uikit-shadcnui/style.css"`, extend the base tsconfig, and call `defineViteConfig()` — all path aliases, Tailwind scanning, and tooling live in the framework layer.

**Stack:** Vue 3 + Vite 8 + Tailwind 4 + shadcn-vue (reka-ui based). Iconography standardized on `@iconify/vue` via `@airovo/shared/icons`.

## Commands

Run from repo root.

| Command | What it does |
|---|---|
| `pnpm dev` | `turbo run dev` — starts all apps (dev server for each `apps/*`) |
| `pnpm build` | `turbo run build` — builds all packages in dependency order |
| `pnpm lint` | `turbo run lint` — runs ESLint per package |
| `pnpm format` | `prettier --write "**/*.{ts,tsx,md}"` |

Per-package scripts follow the same naming: `dev: vite`, `build: vue-tsc --noEmit && vite build`, `lint: eslint "**/*.ts"`.

Single app/package:
- `pnpm --filter playwright dev` — dev server for the demo app
- `pnpm --filter @airovo/vite-config build` — rebuild the shared Vite config (see gotcha below)
- `pnpm --filter @airovo/uikit-shadcnui exec shadcn-vue@latest add <component>` — add a shadcn-vue component

**Requires pnpm 9.15.4** (catalog protocol). Older pnpm will fail on `catalog:` specifiers.

## Architecture

```
apps/*                  ← user-facing apps (apps/playwright is the demo)
packages/core/*         ← framework-level Vue adapters (layouts, stores, config)
packages/ui-kit/vue-ui  ← shadcn-vue components, source-consumed (NO build step)
packages/shared         ← framework-agnostic (icons via @iconify/vue, utils stub)
packages/effects        ← placeholder for third-party UI adapters
app-ui                  ← placeholder for "business layer + generic UI assembly"
internal/*              ← shared build tooling
  vite-config/          ← defineViteConfig factory, built with tsup → consumed as dist
  typescript-config/    ← base.json + vite.json, JSON configs (no build)
  eslint-config/        ← legacy .eslintrc-style config (ESLint 8)
```

### Key conventions

**`defineViteConfig` factory** (`internal/vite-config/src/config.ts`)
- Apps call `export default defineViteConfig()` and the framework injects Vue + Tailwind + path aliases.
- Aliases set by the factory: `#` → `apps/<name>/src`, `@` → `packages/ui-kit/vue-ui/src` (for vue-ui's internal `@/lib/utils`).
- **It is built with tsup** (`pnpm --filter @airovo/vite-config build`). Apps consume `dist/`, so **edits to `src/config.ts` require a rebuild before the change takes effect in any app.**

**Source-only ui-kit consumption**
- `packages/ui-kit/vue-ui/package.json` exports `.` → `./src/index.ts` directly. There is no build step for vue-ui; Vite bundles its source straight into apps. This is intentional (like Vben Admin) — keeps the dev loop fast and avoids pre-build type drift.
- Implication: any tsconfig strictness in `apps/*` flows back into vue-ui's source (with `vueCompilerOptions.strictTemplates`, template type errors in vue-ui surface during the app's `vue-tsc`).

**Tailwind scanning** (`packages/ui-kit/vue-ui/src/styles/globals.css`)
- `@import "tailwindcss"` then `@source` directives tell Tailwind 4 to scan the workspace. Path depth matters: `../../../../core` reaches `packages/core` (4 levels up from `vue-ui/src/styles/`).
- Apps only need `@import "@airovo/uikit-shadcnui/style.css";` once.

**pnpm catalog**
- `pnpm-workspace.yaml` catalogs shared versions (Vue, Vite, Tailwind, TypeScript, `@iconify/vue`, etc.). Package manifests should reference these as `"<dep>": "catalog:"` rather than pinning versions.

**shadcn-vue add** — runs from the package root with `-c packages/ui-kit/vue-ui` to drop components into `vue-ui/src/components/ui/`.

## Layout / scrolling pattern (load-bearing)

The `BasicLayout` uses a vertical `SidebarProvider` with sticky header + content area, deviating from shadcn-vue's default horizontal layout. The height chain **must** be locked at the top for `ScrollArea` to be the single scroll container — otherwise body scrolls too, or horizontal scroll appears:

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

Rules of thumb for any flex/grid scroll container:
- The scrolling element needs an **ancestor with a fixed height** (`h-svh`, not `min-h-svh`).
- Every `flex-1` flex item needs `min-h-0` (vertical) or `min-w-0` (horizontal) so its content can't force it to grow past its allocated size.
- Add `overflow-x-hidden` on ScrollArea to suppress horizontal scroll from grid items with `auto-rows-min` / `aspect-ratio`.

## Known gotchas

- **`@` alias collision** — the factory sets `@` → `vue-ui/src` for vue-ui's internal `@/lib/utils`. Apps must **not** override `@` in their own `vite.config.ts`; use `#` for app src (already provided). Currently `apps/playwright/vite.config.ts` overrides `@` → app src, which silently shadows the framework alias.
- **`--app-header-height` is orphaned** — `header.vue` and `SiteTitle` reference it but only `--header-height` is ever defined (in `layout.vue`). Use `--header-height` everywhere.
- **`pnpm-workspace.yaml`** uses `app-ui/*` glob; `app-ui` is a single package, so this matches nothing. Should be `app-ui` (or `- "app-ui"`).
- **`vue-ui/src/index.ts`** exports `./components/ui/dialog` twice (line 14 and 16) — harmless re-export dedup, but worth cleaning up.
- **`internal/typescript-config/dist/types/`** contains stale `.d.ts` artifacts from a prior `vue-tsc` run. The package has no build script; this directory is gitignored garbage and can be deleted.
- **`app-ui/package.json`** pins `typescript: 5.5.4` while every other package (and catalog) uses TS 6.0.x.
- **`vue-ui/package.json`** still lists three legacy icon libs (`@lucide/vue`, `lucide-vue-next`, `@radix-icons/vue`) alongside the standardized `@iconify/vue` — cleanup target.

## Plan / staged work

See `README.md` for the original feature roadmap and intended directory layout.
</content>
</invoke>