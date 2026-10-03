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
        {
            path: 'components',
            name: 'DashboardComponents',
            component: () => import('../../../views/ComponentsDemo.vue'),
            meta: {
                title: '框架组件',
                titleKey: 'navigation.components',
                icon: 'lucide:layout-grid',
                keepAlive: true,
            },
        },
        {
            path: 'my-form',
            name: 'DashboardMyForm',
            component: () => import('../../../views/MyFormDemo.vue'),
            meta: {
                title: '表单系统',
                titleKey: 'navigation.form',
                icon: 'lucide:form-input',
                keepAlive: true,
            },
        },
    ],
}

export default dashboard
