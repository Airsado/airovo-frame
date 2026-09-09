import type { RouteRecordRaw } from 'vue-router'
import { FrameworkForbidden, FrameworkServerError, FrameworkNetworkError } from '@airovo/views'

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
        component: FrameworkForbidden,
        meta: {
            public: true,
            ignoreLayout: true,
            title: '403',
        },
    },
    {
        path: '/500',
        name: 'ServerError',
        component: FrameworkServerError,
        meta: {
            public: true,
            ignoreLayout: true,
            title: '500',
        },
    },
    {
        path: '/network-error',
        name: 'NetworkError',
        component: FrameworkNetworkError,
        meta: {
            public: true,
            ignoreLayout: true,
            title: '网络错误',
        },
    },
]

export default errors
