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
            path: 'design',
            name: 'DashboardDesign',
            component: () => import('@airovo/design/demo'),
            meta: {
                title: '设计系统',
                icon: 'lucide:palette',
            },
        },
        {
            path: 'my-form',
            name: 'DashboardMyForm',
            component: () => import('../../../views/MyFormDemo.vue'),
            meta: {
                title: '手写表单',
                icon: 'lucide:form-input',
            },
        },
        {
            path: 'mix-demo',
            name: 'DashboardMixDemo',
            component: () => import('../../../views/LayoutDemo.vue'),
            meta: {
                title: 'Mix Layout',
                icon: 'lucide:columns-2',
                layout: 'mix',
            },
        },
        {
            path: 'full-demo',
            name: 'DashboardFullDemo',
            component: () => import('../../../views/LayoutDemo.vue'),
            meta: {
                title: 'Full-Content Layout',
                icon: 'lucide:maximize',
                layout: 'full-content',
            },
        },
    ],
}

export default dashboard
