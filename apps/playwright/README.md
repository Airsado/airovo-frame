# Playwright demo

This app exercises the framework shell, routing, preferences, auth state, request client, permissions, forms, and components against the separate Nitro mock API.

```bash
pnpm --filter mock-api dev
pnpm --filter playwright dev
```

The env files follow the vben-admin layout: `.env` contains stable application
identity, while `.env.development` and `.env.production` contain mode-specific
server and API settings. Use `.env.local` or `.env.<mode>.local` for ignored
machine-specific overrides. In development, `/api` is proxied to the Nitro
service at `http://127.0.0.1:4174`. `VITE_GLOB_API_URL` is emitted to
`_app.config.js` in production so a deployed bundle can change its API endpoint
without rebuilding. Change
`VITE_GLOB_API_URL` in the active mode file to point at another backend. Sign in with
`admin / 123456`; the default destination is `/dashboard/overview`.

The application entry in `src/main.ts` imports three self-registering modules before calling `createApp({ root, preferences })`:

- `src/api/request.ts` configures the shared Axios client, application headers, localized errors, and single-flight 401 refresh.
- `src/router/index.ts` registers route modules, the view-component whitelist, and the dynamic menu API.
- `src/locales/index.ts` registers application translations over framework fallbacks.

Application endpoints live in `src/api/core`, and login, registration, restore, reauthentication, and logout orchestration live in `src/auth/handlers.ts`. The files in `src/views/_core` wrap default framework views so an application can replace their presentation without editing a package. `src/preferences.ts` overrides only the framework defaults needed by this demo.

The Nitro `/menus` response uses `/views/...` component paths. The framework resolves those paths only through the application's static `views` glob. Framework components live in `packages/core`; `app-ui` is reserved for application-level compositions.

The component routes also provide the issue-level integration examples:

- `/dashboard/components` covers DataTable presentation and server query state,
  typed Modal/Drawer usage, selectors, and the bounded SSE LiveLog session;
- `/dashboard/my-form` covers FormApi actions, dynamic dependencies, required
  field rendering, and nested Modal/Dialog form results.

The package name `playwright` identifies this demo app. It does not currently
contain a `@playwright/test` suite; browser acceptance must be reported only
after a real running `5174` instance has been interacted with.
