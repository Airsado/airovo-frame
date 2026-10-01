import type { RouteRecordRaw } from 'vue-router'

const dashboard: RouteRecordRaw = {
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
            component: () => import('../../../views/Overview.vue'),
            meta: {
                title: '概览',
                titleKey: 'navigation.overview',
                icon: 'lucide:layout-dashboard',
                keepAlive: true,
            },
        },
        {
            path: 'developer',
            name: 'DashboardDeveloper',
            component: () => import('../../../views/DeveloperDemo.vue'),
            meta: {
                title: '开发者接入',
                titleKey: 'navigation.developer',
                icon: 'lucide:blocks',
                permissions: ['demo.dynamic'],
                keepAlive: true,
            },
        },
    ],
}

export default dashboard
