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
                icon: 'lucide:layout-dashboard',
            },
        },
        {
            path: 'analytics',
            name: 'DashboardAnalytics',
            component: () => import('../../../views/Analytics.vue'),
            meta: {
                title: '分析',
                icon: 'lucide:chart-bar',
            },
        },
        {
            path: 'components',
            name: 'DashboardComponents',
            component: () => import('../../../views/ComponentsDemo.vue'),
            meta: {
                title: 'app-ui 组件',
                icon: 'lucide:layout-grid',
            },
        },
        {
            path: 'aform',
            name: 'DashboardAForm',
            component: () => import('../../../views/AFormDemo.vue'),
            meta: {
                title: '表单系统',
                icon: 'lucide:list-checks',
            },
        },
        {
            path: 'design',
            name: 'DashboardDesign',
            component: () => import('@airovo/design/demo'),
            meta: {
                title: '设计系统',
                icon: 'lucide:palette',
            },
        },
    ],
}

export default dashboard
