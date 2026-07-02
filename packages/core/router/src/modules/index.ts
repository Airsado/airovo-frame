import type { AgnosticRouteRecord } from '../routeTypes'

/**
 * Framework-internal routes that should always be present regardless of
 * what the app declares. Declared as `AgnosticRouteRecord` so they feed
 * through the same conversion path as app routes.
 *
 * These routes are NOT surfaced as sidebar menu items (`hideInMenu: true`).
 * Apps declare their own menu entries via route modules if they want
 * login/redirect visible.
 */
export const coreRoutes: AgnosticRouteRecord[] = [
    {
        path: '/redirect',
        name: 'Redirect',
        component: () => import('../views/Redirect.vue'),
        meta: { title: 'Redirect', hideInMenu: true },
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue'),
        meta: { title: 'Login', public: true, hideInMenu: true },
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('../views/NotFound.vue'),
        meta: { title: 'Not Found', public: true, hideInMenu: true },
    },
]
