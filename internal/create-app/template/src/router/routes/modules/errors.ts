import type { RouteRecordRaw } from 'vue-router'

/**
 * Error pages belong to the application route registry so an app can replace
 * their wrappers while the framework still supplies the default presentation.
 * They deliberately opt out of AppShell and stay publicly reachable.
 */
const errors: RouteRecordRaw[] = [
    {
        path: '/403',
        name: 'Forbidden',
        component: () => import('../../../views/_core/Forbidden.vue'),
        meta: { public: true, ignoreLayout: true, hideInMenu: true, title: '403' },
    },
    {
        path: '/404',
        name: 'NotFound',
        component: () => import('../../../views/_core/NotFound.vue'),
        meta: { public: true, ignoreLayout: true, hideInMenu: true, title: '页面不存在' },
    },
    {
        path: '/500',
        name: 'ServerError',
        component: () => import('../../../views/_core/ServerError.vue'),
        meta: { public: true, ignoreLayout: true, hideInMenu: true, title: '500' },
    },
    {
        path: '/network-error',
        name: 'NetworkError',
        component: () => import('../../../views/_core/NetworkError.vue'),
        meta: { public: true, ignoreLayout: true, hideInMenu: true, title: '网络错误' },
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFoundFallback',
        component: () => import('../../../views/_core/NotFound.vue'),
        meta: { public: true, ignoreLayout: true, hideInMenu: true, title: '页面不存在' },
    },
]

export default errors
