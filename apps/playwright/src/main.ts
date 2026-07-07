import './style.css'
import { createApp } from '@airovo/app'
import { useAuthStore } from '@airovo/stores/auth'
import routes from './router/routes'
import App from './App.vue'

const { mount } = await createApp({
    name: 'playwright',
    title: import.meta.env.VITE_APP_TITLE ?? 'Playwright Demo',
    homePath: '/dashboard',
    routeModules: routes,
    auth: { useStore: () => useAuthStore() },
    root: App,
})

mount('#app')
