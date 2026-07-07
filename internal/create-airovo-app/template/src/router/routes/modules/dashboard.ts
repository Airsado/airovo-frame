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
            component: () => import('../../views/Overview.vue'),
            meta: {
                title: '概览',
                icon: 'lucide:layout-dashboard',
            },
        },
    ],
}

export default dashboard
