# Changelog

All notable changes to the `airovo-frame` framework are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] — 2026-07-07

### Added

#### Authentication & Routing
- **Built-in auth guard** — `createApp({ auth: { useStore } })` provides a default `beforeEach` that:
  - Lets through routes with `meta.public: true`
  - Lets through path prefixes in `auth.allowPrefix`
  - Bounces unauthenticated users to `loginPath` (with `?redirect=…` query)
  - Bounces logged-in users away from `loginPath`
  - Apps may disable via `auth: false` or layer custom checks via `beforeEach`
- **`useAuthStore`** with `user`, `token`, `isLoggedIn`, `login(params)`, `register(params)`, `changePassword(params)`, `logout()`, `updateUser(updates)`, `hasPermission()`, `hasRole()`
- Pinia + `pinia-plugin-persistedstate` → `localStorage` `airovo-auth` key
- Framework views: `Login.vue`, `Register.vue`, `Profile.vue`, `NotFound.vue`, `Redirect.vue`
  - Inject `auth` via route `props` so views stay decoupled from any concrete store implementation

#### Form System (`@airovo/forms`)
- **`useAForm(schema)`** — wraps `vee-validate` + Zod, returns typed `values` / `errors` / `handleSubmit` / `setField` / `setValues` / `reset` / `validate` / `isSubmitting` / `isValid` / `meta`
- **`<AForm>` component** — JSON-Schema-driven auto-renderer with named-slot overrides
  - Supported `component` kinds: `Input`, `Password`, `Number`, `Email`, `Textarea`
  - Per-field `componentProps`, `description`, `disabled`, `hidden`
  - `v-model:values` + `:errors` two-way binding
- **Preset schemas**: `createLoginSchema()`, `createRegisterSchema()`, `createChangePasswordSchema()`

#### Application Shell (`@airovo/app`)
- **`createApp(options)`** — single factory replacing ~100 lines of bootstrap code with a single call. Default business `main.ts` shrunk from **35 → 19 lines**
- Built-in: `Pinia`, `vue-i18n`, `vue-router`, `Preferences`, `@airovo/effects` opt-in install
- `useAirovo()` composable — accesses `menus` / `progress` via app context (`provide` / `inject`)
- Smart defaults: `name`, `title`, `homePath`, `menusMod`, `locale`, `themeMode`
- `routeModules` option — consumes a pre-declared `import.meta.glob(...)` map (apps call glob at module level; Vite needs a static literal)
- `effects` option — opt in to third-party UI adapters (`element-plus` / `naive-ui`), false to disable

#### Third-Party UI Adapters (`@airovo/effects`)
- `installAdapters(app, options)` unified entry
- **`ElementPlusAdapter`** — lazy-installs `element-plus`, applies dark-mode CSS variables, mirrors framework locale to EP locale (`zhCn` / `en`), exposes `<el-config-provider :locale>` payload via `provide('ep-locale')`
- **`NaiveUIAdapter`** — lazy-installs `naive-ui`, provides `$naive` namespace via `provide('$naive')`, mirrors date-picker locale (`dateZhCN` / `dateEnUS`), dark-mode follows `class="dark"`
- `applyDocumentTheme(isDark)` shared helper

#### UI Components (`@airovo/uikit-shadcnui`)
The package was **renamed** from `vue-ui` → `shadcn-vue` and the import scope updated to `@airovo/uikit-shadcnui`. Tailwind 4 + reka-ui primitives + `class-variance-authority` + `cn()` util + `data-slot` conventions remain the foundation.

- `Button`, `Input`, `Textarea`, `Label`, `Separator`, `Skeleton`
- `Avatar` / `AvatarImage` / `AvatarFallback`
- `Badge`
- `Sheet` / `Dialog` family
- `Sidebar` family + `useSidebar()`
- `Tooltip` / `HoverCard`
- `DropdownMenu` family
- `NavigationMenu`
- `Breadcrumb` family
- `ScrollArea`
- `Command` (cmdk)
- `HoverCard`
- `Collapsible` family
- **`Field` family** (NEW export): `Field`, `FieldContent`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldLabel`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldTitle`
- `Label` newly exported

#### Business Components (`@airovo/app-ui`)
- **`UserCard`** — avatar + name + email + roles + actions slot
- **`StatCard`** — title + value + trend (up/down/flat, `inverse`) + icon + loading skeleton
- **`StatusBadge`** — 8 status presets (`success` / `error` / `warning` / `processing` / `pending` / `disabled` / `info` / `neutral`), `pulse` animation, custom text
- **`EmptyState`** — icon + title + description + action
- **`ResultPage`** — 7 status presets (`success` / `error` / `warning` / `info` / `403` / `404` / `500`), auto home navigation on errors

#### Loading & Breadcrumbs
- **`BasicLoadingBar`** uses `nprogress` with theme color via `--primary`
- **Dynamic breadcrumbs** — `header.vue` reads `route.matched`, uses `meta.title`, skips `meta.hideInMenu`

#### Scaffolding CLI (`@airovo/create-airovo-app`)
- **`pnpm create airovo-app <name>`** — scaffolds a new business app from `internal/create-airovo-app/template/`
- Template includes: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/{main,App,style}.ts/vue`, `src/router/{routes.ts,routes/modules/{auth,dashboard}.ts}`, `src/views/Overview.vue`
- `__APP_NAME__` / `__APP_TITLE__` placeholders auto-replaced with the user's input
- Output:
  ```
  📦 Scaffolding <name> from template...
  ✅ Done! Next steps:
    cd <name>
    pnpm install
    pnpm dev
  ```

#### Testing
- **vitest** `^2.1.0` (devDep)
- **@vue/test-utils** `^2.4.0` (devDep)
- **happy-dom** `^15.0.0` (devDep)
- `@airovo/stores` — `useAuthStore` 6 tests passing (login/register/logout/updateUser/permissions)
- `@airovo/forms` — `useAForm` + preset factories 10 tests passing (init values, fieldList filter, setField, reset, validation, schemas)

### Changed

#### Package Renames
- `packages/ui-kit/vue-ui/` → `packages/ui-kit/shadcn-vue/`
- `@airovo/uikit-vue` → **`@airovo/uikit-shadcnui`**
  - Touched files: all `core/*` packages, all `layouts/*` Vue components, app `package.json`, `vite.config.ts` alias path, `globals.css` @source directives
  - Renamed in `pnpm-workspace.yaml`, `internal/vite-config/src/config.ts` updated alias + `optimizeDeps.exclude`

#### Dependency Direction Cleanup
- Removed cyclic dependencies: `@airovo/views` no longer imports `@airovo/stores` directly; views use `props.auth` injection (consumers supply the store methods)
- `@airovo/layouts` no longer imports auth-specific code; auth store is injected by the app

#### File System Moves
- `packages/effects/src/adapters/{element-plus, naive-ui}/index.ts` populated with real code (was previously stub)

### Removed
- `packages/core/layouts/src/authentication/` (empty stub directory)
- Sonner export from `@airovo/uikit-shadcnui` (history had missing-icon references and was unused)

## Fixed Bugs

- **Circular dependency on `pnpm dev`**
  - `@airovo/views → @airovo/stores` → `@airovo/config` → `@airovo/router` → `@airovo/views`
  - Fix: removed `views → stores` import; views accept `auth` via props; business apps inject auth methods from their own stores
- **Vite `import.meta.glob` literal-required**
  - `createApp()` could not pass a runtime path to `import.meta.glob()` (Vite requires a static literal)
  - Fix: added `routeModules?: RouteModuleGlobs` option; apps call `import.meta.glob('./routes/modules/*.ts', { eager: false })` at their module level and pass the result
- **`<script setup>` export restriction**
  - `AForm.vue` and `app-ui` components had `export type` inside `<script setup>` blocks, which Vue 3 disallows
  - Fix: types extracted to `*.types.ts` sibling files; components re-export as `export {}` from `index.ts`
- **`@rero-icons/vue` missing icons in `Sonner.vue`**
  - `CircleCheckIcon` / `InfoIcon` / `OctagonXIcon` / `TriangleAlertIcon` not exported from v1.0.0
  - Fix: removed `sonner` export from `@airovo/uikit-shadcnui` index (unused)
- **Duplicate path issues in demo**
  - `Login.vue` used `@iconify/vue` but business app didn't depend on it
  - Fix: switched to `@airovo/shared/icons`
- **Layout routes pointing to nonexistent views**
  - Bug: Auth views on apps side were duplicated imports of `@airovo/views`; caused inconsistent behavior. Resolved by routing at app level and using framework defaults with props injection.
- **`pnpm-workspace.yaml` empty glob**
  - `- "app-ui/*"` matched nothing because `app-ui` is single package, not a directory
  - Fix: `- "app-ui"`

## Performance & Cleanup

- Removed `radix-icons/vue` legacy references from `Sonner.vue`
- Removed `@lucide/vue` + `lucide-vue-next` + `@radix-icons/vue` conflicting icon libs (uniform icon usage via `@iconify/vue`)
- TS strict in `template` types: `vueCompilerOptions.strictTemplates` enabled; errors propagate from app's `vue-tsc` into packages

## [Architectural Decisions]

### Module Boundaries
- `core/views` — only default views (Login/Register/Profile/NotFound/Redirect); accepts `auth` via `props`
- `core/router` — only router core logic; business apps register their own routes via `import.meta.glob`
- `core/stores` — only Pinia + persist; framework views call into auth via app-injected props
- `core/layouts` — only layout components (BasicLayout/Header/Sidebar); no stores
- `core/forms` — only form system (useAForm + AForm); no business
- `core/app` — only `createApp` factory; no business; no views
- `effects` — third-party UI adapters (Element Plus / Naive UI)
- `ui-kit/shadcn-vue` — base UI primitives (shadcn-vue style)
- `app-ui` — business UI composites on top of `uikit-shared` / `effects` / own components

### Dependency Direction (no cycles)
```
@airovo/views      → uikit-shadcnui
@airovo/router     → views (lazy), uikit-shadcnui
@airovo/stores     → pinia
@airovo/config     → (none)
@airovo/forms      → @vee-validate/zod, zod, uikit-shadcnui
@airovo/effects    → stores (types only)
@airovo/app        → effects, layouts, router, stores, config, views
@airovo/app-ui     → uikit-shadcnui
apps/*           → 按需引用
```

### Business App Migration Cost
- **Original** `main.ts`: 35 lines
- **`createApp()` factory**: 26 lines
- **Built-in auth guard**: **19 lines** (current)
- Total reduction from original: **-45%**
- Framework code (1694 lines) vs Business code (624 lines): **4.8× ratio**

### Critical Files
- `packages/core/app/src/createApp.ts` — application shell factory
- `packages/core/forms/src/AForm.vue` + `AForm.types.ts` — form auto-renderer
- `packages/effects/src/install.ts` — adapter registry
- `packages/effects/src/adapters/element-plus/index.ts` — element plus install
- `packages/effects/src/adapters/naive-ui/index.ts` — naive ui install
- `packages/core/views/src/{Login,Register,Profile}.vue` — framework default views
- `packages/core/layouts/src/basic/header/header.vue` — breadcrumbs, user dropdown
- `apps/playwright/src/main.ts` — demo entry (19 lines)

## [Testing]

### Tools Added
- **vitest** `^2.1.0` (devDep)
- **@vue/test-utils** `^2.4.0` (devDep)
- **happy-dom** `^15.0.0` (devDep)

### Test Coverage
- `@airovo/stores` — `useAuthStore` 6 tests passing (login/register/logout/permissions)
- Future: extend to `useAForm`, `createApp`, AForm component, app-ui components

### Running Tests
```bash
pnpm --filter @airovo/stores test
```
