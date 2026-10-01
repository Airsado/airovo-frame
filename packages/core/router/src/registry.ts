import type { Component } from 'vue'
import type {
    NavigationGuardWithThis,
    NavigationHookAfter,
    RouteRecordRaw,
    Router,
} from 'vue-router'
import type { FrameworkRouter } from './createRouter'
import type { MenuItemInput } from './routeTypes'

export type AppRouteModule = RouteRecordRaw | RouteRecordRaw[] | { default?: RouteRecordRaw | RouteRecordRaw[] }
export type AppRouteLoader = () => Promise<AppRouteModule>
export type AppRouteLoaders = Record<string, AppRouteLoader>
export type AppPageLoaders = Record<string, () => Promise<{ default?: Component } | Component> | Component>

export interface AppMenuSource {
    load: () => Promise<unknown>
    normalize?: (raw: unknown) => MenuItemInput[]
}

export interface AppRouterRegistration {
    routes: AppRouteLoaders
    pages?: AppPageLoaders
    menus?: AppMenuSource
    beforeEach?: NavigationGuardWithThis<undefined>[]
    beforeResolve?: NavigationGuardWithThis<undefined>[]
    afterEach?: NavigationHookAfter[]
    history?: 'hash' | 'web'
    base?: string
}

let registration: AppRouterRegistration | null = null
let activeRouter: Router | null = null

/** Register the consuming application's routes before createApp() runs. */
export function registerAppRouter(value: AppRouterRegistration): void {
    registration = value
}

export function getAppRouterRegistration(): AppRouterRegistration | null {
    return registration
}

export function setActiveAppRouter(router: Router | null): void {
    activeRouter = router
}

/** Use from app-owned auth handlers outside component setup. */
export function getAppRouter(): Router {
    if (!activeRouter) throw new Error('[framework/router] router is not ready; call createApp() first')
    return activeRouter
}

/** Test/HMR escape hatch. It is intentionally not needed by app code. */
export function resetAppRouterRegistration(): void {
    registration = null
    activeRouter = null
}

export type RegisteredFrameworkRouter = FrameworkRouter
