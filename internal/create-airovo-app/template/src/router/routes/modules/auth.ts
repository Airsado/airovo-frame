import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@airovo/stores/auth'

const auth: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@airovo/views').then((m) => m.Login),
        meta: {
            title: '登录',
            public: true,
            hideInMenu: true,
            ignoreLayout: true,
        },
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('@airovo/views').then((m) => m.Profile),
        meta: {
            title: '个人中心',
            icon: 'lucide:user',
            hideInMenu: true,
        },
        props: () => ({
            auth: (() => {
                const store = useAuthStore()
                return {
                    get user() {
                        return store.user
                    },
                    get isLoggedIn() {
                        return store.isLoggedIn
                    },
                    changePassword: store.changePassword.bind(store),
                    logout: store.logout.bind(store),
                }
            })(),
        }),
    },
]

export default auth
