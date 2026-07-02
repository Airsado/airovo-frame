import type { AgnosticRouteRecord } from '@airovo/router'

const Overview = () => import('../../../views/Overview.vue')
const Analytics = () => import('../../../views/Analytics.vue')

/**
 * Framework-agnostic route record. The vue-router adapter converts this
 * to `RouteRecordRaw` at registration time. The same structure could
 * feed a React Router adapter in the future without changes here.
 *
 * The parent has no `component` — it's purely structural (groups the
 * children for the sidebar). Visiting `/dashboard` redirects to the
 * default child.
 */
const dashboard: AgnosticRouteRecord = {
    path: '/dashboard',
    name: 'Dashboard',
    redirect: '/dashboard/overview',
    meta: {
        title: '仪表盘',
        icon: 'lucide:home',
    },
    children: [
        {
            path: 'overview',
            name: 'DashboardOverview',
            component: Overview,
            meta: {
                title: '概览',
                icon: 'lucide:layout-dashboard',
            },
        },
        {
            path: 'analytics',
            name: 'DashboardAnalytics',
            component: Analytics,
            meta: {
                title: '分析',
                icon: 'lucide:chart-bar',
            },
        },
    ],
}

export default dashboard
