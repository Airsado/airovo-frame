import type { RouteRecordRaw } from 'vue-router'
/**
 * Error-page routes. Registered at the top level (outside the
 * dashboard layout) so they render in the chrome-less
 * `BasicLayoutFullContent` variant — these are the kinds of pages
 * the full-content layout exists for.
 *
 * `meta.layout: 'full-content'` makes `LayoutHost` render
 * `BasicLayoutFullContent` (no header / sidebar).
 */
const errors: RouteRecordRaw[] = [
    {
        path: '/403',
        name: 'Forbidden',
        component: () => import('../../../views/_core/Forbidden.vue'),
        meta: {
            public: true,
            ignoreLayout: true,
            hideInMenu: true,
            title: '403',
        },
    },
    {
        path: '/500',
        name: 'ServerError',
        component: () => import('../../../views/_core/ServerError.vue'),
        meta: {
            public: true,
            ignoreLayout: true,
            hideInMenu: true,
            title: '500',
        },
    },
    {
        path: '/network-error',
        name: 'NetworkError',
        component: () => import('../../../views/_core/NetworkError.vue'),
        meta: {
            public: true,
            ignoreLayout: true,
            hideInMenu: true,
            title: '网络错误',
        },
    },
    {
        path: '/404',
        name: 'NotFound',
        component: () => import('../../../views/_core/NotFound.vue'),
        meta: { public: true, ignoreLayout: true, hideInMenu: true, title: '页面不存在' },
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFoundFallback',
        component: () => import('../../../views/_core/NotFound.vue'),
        meta: {
            public: true,
            ignoreLayout: true,
            hideInMenu: true,
            title: '页面不存在',
        },
    },
]

export default errors
