import type { RouteRecordRaw } from 'vue-router'

const dashboard: RouteRecordRaw = {
    path: '/dashboard',
    name: 'Dashboard',
    redirect: '/dashboard/analytics',
    meta: { title: '仪表盘', titleKey: 'navigation.dashboard', icon: 'lucide:home' },
    children: [{ path: 'analytics', name: 'DashboardAnalytics', component: () => import('../../../views/Analytics.vue'), meta: { title: '仪表盘', titleKey: 'navigation.analytics', icon: 'lucide:chart-bar', cacheName: 'DashboardAnalytics' } }],
}

export default dashboard
