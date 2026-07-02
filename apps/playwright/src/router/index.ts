import { resolvePreferences } from '@airovo/config/preferences'
import {
    createAppRouter,
    loadAllModules,
    type AgnosticRouteRecord,
} from '@airovo/router'

import { appOverrides } from '../preferences'

/**
 * App-side router entry. Owns the bundler-specific glob invocation and
 * hands the resolved `AgnosticRouteRecord[]` to the framework's
 * `createAppRouter` (vue-router adapter).
 *
 * The framework stays bundler-agnostic — only this file uses Vite's
 * `import.meta.glob`. New feature routes added under `routes/modules/`
 * are picked up automatically.
 */
const moduleGlobs = import.meta.glob<{ default: AgnosticRouteRecord }>(
    './routes/modules/*.ts',
    { eager: false },
)

const modules = await loadAllModules(Object.keys(moduleGlobs), moduleGlobs)

// Merge framework defaults + app overrides once, then pass the resulting
// `Preferences` shape to the router so it can pick up `app.homePath` and
// `app.menusMod` without explicit option threading.
const preferences = resolvePreferences(appOverrides)

export const appRouter = createAppRouter({
    preferences,
    modules,
})
