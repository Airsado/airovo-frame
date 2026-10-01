# __APP_NAME__

This app is scaffolded with `@airovo/app`. It owns the business routes, API
modules, authentication handlers, and application-level components while the
framework provides the shell, request client, session state, permissions,
theme, and i18n services.

## Configure the app

The generated app follows the vben-admin environment layout. `.env` contains
stable application identity, while `.env.development` and `.env.production`
contain mode-specific server and API settings. Use `.env.local` or
`.env.<mode>.local` for ignored machine-specific overrides:

```text
VITE_APP_TITLE=__APP_TITLE__
VITE_APP_NAMESPACE=__APP_NAME__
VITE_PORT=5173
VITE_BASE=/
VITE_GLOB_API_URL=/api
VITE_NITRO_MOCK=true
VITE_ROUTER_HISTORY=web
```

`VITE_GLOB_API_URL` is used by the app request layer. During production builds
the framework Vite config emits it to `_app.config.js`, so a deployed bundle
can point at another API without being rebuilt. Keep secrets out of `VITE_*`
variables because Vite embeds them in the browser bundle.

```bash
pnpm --filter mock-api dev
pnpm --filter __APP_NAME__ dev
```
