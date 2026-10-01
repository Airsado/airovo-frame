import type { RouteRecordRaw } from 'vue-router'

const core: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../../../views/_core/Login.vue'),
        meta: { title: '登录', public: true, hideInMenu: true, ignoreLayout: true },
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../../../views/_core/Register.vue'),
        meta: { title: '注册', public: true, hideInMenu: true, ignoreLayout: true },
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('../../../views/_core/Profile.vue'),
        meta: { title: '个人中心', icon: 'lucide:user', hideInMenu: true },
    },
]

export default core
