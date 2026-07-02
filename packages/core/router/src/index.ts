export { createAppRouter } from './createRouter'
export { toVueRoutes } from './adapter'
export { coreRoutes } from './modules'
export { deriveMenus } from './derive'
export { mergeMenus } from './merge'
export { loadAllModules } from './load'
export type {
    AppRouter,
    PreferencesBridge,
    RouterOptions,
} from './types'
export type {
    AgnosticRouteRecord,
    MenuItem,
    MenusMod,
    RouteMeta,
} from './routeTypes'
