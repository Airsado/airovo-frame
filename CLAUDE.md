# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What this repo is

airovo-frame is a pnpm + Turborepo monorepo providing a zero-config Vue 3
framework. Business apps only need three lines: `@import` the stylesheet,
extend the base tsconfig, and call `defineViteConfig()`. Everything else
(path aliases, Tailwind scanning, pnpm catalog versions, build chain)
lives in the framework layer.

**Stack:** Vue 3 + Vite 8 + Tailwind 4 + shadcn-vue (reka-ui under the
hood) + vee-validate/zod. Icons go through `@iconify/vue` (re-exported
as `@airovo/shared/icons`). Requires **Node ≥ 18** and **pnpm 9.15.4**
(the catalog protocol is the version-locking mechanism).

User-facing overview lives in `README.md`. This file is for Claude's
working memory: it focuses on the *non-obvious* architectural rules and
recent decisions that don't fit in README's narrative.

---

## Commands

Run from repo root.

| Command | Effect |
|---|---|
| `pnpm install` | install all deps; required after any catalog/package.json change |
| `pnpm dev` | turbo run dev — starts all apps |
| `pnpm build` | turbo run build — sequential by dep graph (vite-config & create-airovo-app via tsup, then apps) |
| `pnpm lint` | turbo run lint — per-package ESLint |
| `pnpm format` | prettier --write |
| `pnpm --filter playwright exec vue-tsc --noEmit` | typecheck the demo app (best signal for "did I break something") |
| `pnpm --filter @airovo/<pkg> test` | run vitest in a single package (14+ tests across request/permission/tabs/forms) |
| `pnpm --filter @airovo/<pkg> build` | rebuild a single package's tsup output |
| `pnpm --filter @airovo/vite-config build` | **must rebuild after editing `vite-config/src/config.ts`** — apps consume `dist/` |
| `pnpm create airovo-app <name>` | scaffold a new business app via the CLI template |

---

## Architecture — the big picture

### Where things live

```
apps/playwright/          ← the demo (only app)
packages/
  core/                   ← framework layer (consumed source-direct, NOT built)
    app/                  ← createApp() factory
    router/               ← thin vue-router wrapper (menus + progress)
    layouts/              ← BasicLayout / BasicHeader / BasicSidebar
    views/                ← default Login/Register/Profile/NotFound/Redirect
    stores/               ← ALL framework stores (auth, theme, i18n, notification, preferences, tabs)
    forms/                ← useAForm + <AForm> + <FormFieldRender> + <FormMessage> + FormApi
    request/              ← axios + auth interceptors + single-flight refresh
    permission/           ← usePermissionStore + v-permission directive
    tabs/                 ← multi-tab state (BasicTabBar + useTabStore)
    config/               ← Preferences types + manager + i18n
  ui-kit/shadcn-vue/      ← shadcn-vue components, SOURCE-consumed
  shared/                 ← @iconify/vue re-export
  effects/                ← element-plus / naive-ui adapters
  design/                 ← @airovo/design tokens + live Demo
app-ui/                   ← business composites (UserCard, StatCard, StatusBadge, EmptyState, ResultPage, AirovoTable, 20+ rich component stubs)
internal/
  vite-config/            ← defineViteConfig factory (tsup → dist consumed by apps)
  typescript-config/      ← base.json + vite.json (JSON, no build)
  eslint-config/          ← legacy .eslintrc (ESLint 8)
  create-airovo-app/      ← CLI scaffolding (tsup → bin)
```

### Dependency direction (no cycles)

```
app → effects, layouts, router, stores, config, views, forms,
      request, permission, tabs
layouts → stores, shared, uikit-shadcnui, tabs
views → uikit-shadcnui  (NOT stores — auth injected via route props)
forms → uikit-shadcnui, vee-validate, zod
effects → stores (types only)
design → uikit-shadcnui
app-ui → uikit-shadcnui
request → stores (auth surface only — no circular import)
permission → router, stores, uikit-shadcnui
tabs → router, stores, layouts, uikit-shadcnui
router → vue + vue-router only
shared → @iconify/vue
config → (nothing)
```

**Critical rule — every framework store lives in `@airovo/stores`.** Feature
packages (tabs, request, permission, forms) must NOT define their own
Pinia stores. Add a subpath export to `@airovo/stores` (e.g.
`./tabs`) instead. This keeps the import surface predictable and the
persistence/typing story consistent.

---

## Key architectural rules

### `createApp()` install order (in `packages/core/app/src/createApp.ts`)

`installRequest` → `installPermission` → `installTabs` (order matters).
Apps call `await createApp({ ... })` then optionally `installRequest /
installPermission / installTabs` themselves — but the framework's own
createApp already wires all three.

The `AuthGuardConfig.useStore` is reactive — `installPermission` reads
the auth surface via this accessor, NOT a direct store import (avoids
the stores ↔ permission circular import).

### Form system (v5-aligned)

`packages/core/forms/` is the most architecturally important package.
Pattern (matches vben-admin v5's `useForm` + `BasicForm`):

- **`useAForm(options)`** → returns `{ api, values, errors, ... }` plus
  the FormApi instance. The `errors` returned is `api.errors` (a
  reactive Ref<Record<string,string>>).
- **`FormApi`** is a CLASS, not a Pinia store. It holds a ref to the
  raw vee-validate form context, mirrors its `errors` into a reactive
  Ref, and exposes the full v5 `FormActionType`: `validate` /
  `validateField` / `clearValid` / `resetFields` / `updateSchema` /
  `resetSchema` / `appendSchemaByField` / `removeSchemaByField` /
  `setProps` / `scrollToField` / `submitForm`.
- **`FormFieldSchema`** uses **inline functions** (not a separate
  `dependencies` array). Each dynamic prop receives `(ctx) => result`
  where `ctx = { values, api }`:
  ```ts
  { fieldName: 'dept', show: ctx => ctx.values.role === 'admin',
    disabled: ctx => !ctx.values.editable,
    defaultValue: ctx => ctx.values.role,
    componentProps: ctx => ({ options: ctx.values.role ? allDepts : [] }) }
  ```
- **`<AForm>`** consumes `props.api.errors` directly (no local watch
  mirror). Shows a form-level error summary on submit failure and
  scrolls to the first errored field. Resolves inline `show/disabled/
  componentProps` once per render and passes the result to
  `<FormFieldRender>` as explicit props.
- **`<FormFieldRender>`** (extracted into its own SFC) reads per-field
  errors from `api.errors[fieldName]`, falls back to `useField`
  per-field rules. Render is via `<component :is="componentMap[...]">`.
- **`<FormMessage for="email" />`** (in `@airovo/uikit-shadcnui`) is
  the v5-style escape hatch for apps that roll their own field
  layout; reads the error from the form context via `inject`.

Tests live alongside the source (`form-api.test.ts`, 12 cases). The
pre-existing `useAForm.test.ts` was deleted because it transitively
imported `AForm.vue` through `./index`, which the node-env vitest
config can't parse. The new `form-api.test.ts` covers all of the v5
surface.

### Source-only consumption (ui-kit + core/*)

`packages/ui-kit/shadcn-vue/package.json` exports `.` → `./src/index.ts`.
**No build step** for ui-kit. Same for `core/app`, `core/router`,
`core/layouts`, `core/views`, `core/stores`, `core/forms`, etc. Vite
bundles the source directly into apps.

Consequence: a TS error in any framework file surfaces during the
demo app's `vue-tsc --noEmit`. There's no `pnpm --filter @airovo/forms
build` to catch form errors independently — `pnpm --filter playwright
exec vue-tsc --noEmit` is the canonical signal.

### Tailwind scanning

`packages/ui-kit/shadcn-vue/src/styles/globals.css` declares:
```css
@source "../components";
@source "../../../../core";
```
Apps only need `@import "@airovo/uikit-shadcnui/style.css";` once.
Class names used in `core/*` are picked up automatically.

### Layout / scrolling pattern (load-bearing)

`BasicLayout` is a vertical `SidebarProvider` with a sticky header +
flex content area. The height chain is **locked at the top** so
`ScrollArea` is the only scroll container:
```vue
<div class="h-svh overflow-hidden [--header-height:calc(--spacing(14))]">
  <SidebarProvider class="flex h-full flex-col">
    <BasicHeader />
    <div class="flex flex-1 min-h-0 bg-sidebar">
      <BasicSidebar />
      <SidebarInset>
        <main class="flex min-h-0 flex-1 flex-col">
          <BasicTabBar v-if="showTabs" />
          <ScrollArea class="flex-1 min-w-0 min-h-0 overflow-x-hidden">
            <slot />
          </ScrollArea>
        </main>
      </SidebarInset>
    </div>
  </SidebarProvider>
</div>
```
Rules: every `flex-1` child needs `min-h-0`/`min-w-0`; the root
must be `h-svh` (not `min-h-svh`); `<ScrollArea>` gets
`overflow-x-hidden` to suppress horizontal scroll from grid items.

### `defineViteConfig` opt-in flags

`internal/vite-config/src/config.ts` defines a `ViteConfig` interface
that extends `UserConfig` with `vitePlugins?: { mock?, compression?,
visualizer? }`. Each flag lazy-imports its plugin. Apps opt in like:
```ts
export default defineViteConfig({
  vitePlugins: { mock: true, compression: true, visualizer: true },
})
```
The plugins are real deps of `@airovo/vite-config` (not peer deps) so
the lazy `require()` resolves at build time.

### Chart: shadcn-vue Chart over Chart.js / vue-chartjs

`packages/ui-kit/shadcn-vue/src/components/ui/chart/` exposes
`<ChartContainer type="line|bar|pie|doughnut|radar" :data :options />`
plus `<ChartTooltip />` and `<ChartLegend />`. Colors are auto-bound
to `--color-chart-1..5` CSS vars (set in `globals.css`); dark mode
swaps them automatically. Peer deps for the app: `chart.js` and
`vue-chartjs` (both in catalog).

### Errors must be reactive

The recurring bug pattern (hit twice in form work): reading a
vee-validate ref's `.value` through a property path on a plain
(non-reactive) object won't trigger Vue's reactivity tracker. The
fixes:
- `FormApi` exposes errors as a proper `Ref<Record<string,string>>`
  that is populated by a watch *inside* `mount()`. AForm consumes
  `props.api.errors` directly — never reads through
  `props.api.form?.errors` from a watch.
- `getValues()` unwraps the values ref (`raw.value ?? raw`) so
  consumers get a plain object.

When adding a new reactive surface from a third-party library that
returns plain objects, always wrap the result in a `ref()` inside
the same `mount()` so the property is read once through a reactive
context.

---

## Known gotchas (the high-impact ones)

- **`@/lib/utils` is shadcn-vue's internal alias.** vite-config maps
  `@` → `packages/ui-kit/shadcn-vue/src/`. Apps must use `#` for their
  own `src/`. Never redefine `@` in an app's `vite.config.ts`.
- **`strictTemplates: false`** in `internal/typescript-config/base.json`.
  shadcn-vue + reka-ui components use `data-slot`, `dataSidebar`,
  `onClick`, `hidden` etc. that the reka-ui TypeScript types don't
  declare. With `strictTemplates: true` (vue-tsc strict) you'd get
  hundreds of false-positive type errors. v5's shadcn-vue ecosystem
  universally disables this.
- **Workspace packages must be in `optimizeDeps.exclude`** in
  `internal/vite-config/src/config.ts`. Vite's dep scanner tries to
  pre-bundle them and fails because they have no `dist/` (no build
  step). The current list: `config / layouts / router / stores /
  uikit-shadcnui / forms / views / app / design / effects / app-ui
  / request / permission / tabs`. Add a new workspace source package
  to BOTH this list AND `pnpm-workspace.yaml`.
- **The `@` alias is also shadcn-vue's internal `cn()` import.** If
  you add a new shadcn-vue component that imports `@/lib/utils`, make
  sure the import path resolves (use the `@` alias in shadcn-vue
  components; use `#` in app code).
- **`pnpm install` is required after editing `pnpm-workspace.yaml` or
  any package's dependencies.** pnpm caches the lockfile; if the
  install "completes" in <2s without adding new packages, the deps
  weren't picked up. Use `pnpm install --force` if needed.
- **The forms package's vitest tests use `environment: 'node'`** (not
  happy-dom) because the FormApi is pure TypeScript. The vue
  components inside AForm/FormFieldRender are not directly unit
  tested; they're verified by `pnpm --filter playwright exec vue-tsc
  --noEmit` + the demo's dev runtime.
- **The legacy icon libs (`@lucide/vue`, `lucide-vue-next`,
  `@radix-icons/vue`) are still in shadcn-vue's deps.** They're
  transitional — the shadcn-vue components still import from them.
  Migration to `@iconify/vue` only across all components is tracked
  as P2 follow-up; until then, do NOT remove them or shadcn-vue
  components break.
- **`@vitejs/plugin-vue` ESM/CJS in vitest.** The forms package's
  vitest config uses `environment: 'node'` to avoid loading
  `@vitejs/plugin-vue` via CJS `require()`. Don't add a `vue()`
  plugin to that config unless you also fix the loader.
- **`useAForm` is not Pinia.** It's a plain composable returning a
  `FormApi` class instance. The reactivity comes from the
  `Ref<Record<string,string>>` it exposes, not from Pinia.

---

## Common development tasks (where to look)

| Task | Where |
|---|---|
| Add a new shadcn-vue component | `packages/ui-kit/shadcn-vue/src/components/ui/<name>/` + export from `index.ts` |
| Add a new app-ui business component | `app-ui/src/components/<name>/` + export from `app-ui/src/index.ts` |
| Add a new framework store | `packages/core/stores/src/<name>/` + re-export from `stores/src/index.ts` + add `./<name>` subpath in `stores/package.json` exports |
| Add a new Pinia store directly | Same as above; **never** put a store in a feature package |
| Add a new permission check | `meta.roles` / `meta.permissions` on a route, then `v-permission="'sys.x.read'"` on the element. `usePermissionStore().hasAccess(meta)` for imperative. |
| Add a new tab to the demo app | `apps/playwright/src/router/routes/modules/<file>.ts` — `meta.affix` pins the tab |
| Add a new Vite plugin to the framework | Add to `internal/vite-config/src/config.ts` under `vitePlugins: {}` (lazy import) + add to `package.json` deps + `pnpm-workspace.yaml` catalog |
| Update the preferences system | `packages/core/config/src/preferences/` — types in `types.ts`, merge logic in `merge.ts`, runtime manager in `manager.ts`. `applyTheme()` is where DOM tokens get written. |
| Add a new HTTP endpoint | `useRequest()` returns the axios instance; consumers call `http.get(...)`. The auth interceptor handles 401 + refresh automatically. |

---

## Build chain facts

- `pnpm build` runs in topological order (Turbo's `^build`). The
  `internal/vite-config` package rebuilds first (tsup → dist), then
  `internal/create-airovo-app` (tsup → bin), then apps.
- `apps/playwright`'s build is `vue-tsc --noEmit && vite build` —
  the `vue-tsc` step is the only typecheck pass for the whole
  framework (ui-kit + core/* flow through it).
- `pnpm --filter playwright dev` is the fastest way to verify a
  framework change end-to-end: the Vite dev server picks up the
  source changes with HMR.
- **No tests for the demo app itself.** The demo is verified by
  manual + dev server + `vue-tsc`. Component unit tests live alongside
  their source in the framework packages.
