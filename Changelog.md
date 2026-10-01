# Changelog

## [Unreleased]

### Changed

- `createApp({ root, preferences })` is now the only framework startup contract and
  returns only `{ mount }`.
- Apps self-register request setup, session restoration, routes/pages, and locales through
  side-effect imports before calling `createApp()`.
- Auth, refresh, user, menu, request interceptors, error toasts, and navigation handlers now
  live in the application under `src/api` and `src/auth`.
- The framework owns only auth session state, the single Axios instance, default token/header
  behavior, `RequestError` normalization, default guards, permissions, tabs, layouts, and
  default views.
- Backend menus resolve vben-style `/views/...` component paths against the application's
  static views glob.
- `app-ui` is reserved for application business composites; framework components live under
  `packages/core/components` and shadcn-vue remains the primitive UI layer.
- The starter template and `apps/playwright` now use the same application-side registration
  architecture and include a Nitro mock service for auth, refresh, menus, permissions, and
  error-page demonstrations.

### Fixed

- Mock API CORS now allows the application request headers used by the demo, so browser
  preflight reaches login, menus, refresh, and protected endpoints.
- Permission directives react immediately when the active role or permission set changes.
- Preference storage versioning prevents old structural layout/header values from overriding
  application defaults.
- Required form fields render a visible marker and `aria-required` state.

### Verification

- `pnpm build`, `pnpm --filter mock-api typecheck`, and the workspace lint pass. The
  production build only reports existing Tailwind/Rolldown warnings.
- Core Vitest suites pass when run in an unrestricted shell; the default workspace sandbox
  blocks their esbuild/worker processes with `spawn EPERM`.
- Browser verification on the user-managed 5174 process remains an explicit follow-up; this
  turn did not start that process or claim a screenshot-based pass.
