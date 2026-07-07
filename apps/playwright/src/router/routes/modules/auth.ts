import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@airovo/stores/auth'

const auth: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../../../views/Login.vue'),
        meta: {
            title: '登录',
            public: true,
            hideInMenu: true,
            ignoreLayout: true,
        },
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('@airovo/views').then((m) => m.Register),
        meta: {
            title: '注册',
            public: true,
            hideInMenu: true,
            ignoreLayout: true,
        },
        // Inject auth store via route props pattern.
        // Framework views declare their API via prop types.
        props: () => ({
            auth: {
                register: async (params: {
                    username: string
                    email: string
                    password: string
                    confirmPassword: string
                }) => {
                    const store = useAuthStore()
                    const ok = await store.register(params)
                    return ok ? null : { code: 'invalid', message: '注册失败，请稍后重试' }
                },
            },
        }),
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
