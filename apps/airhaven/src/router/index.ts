import { registerAppRouter } from '@airovo/app'
import type { AppRouteLoaders } from '@airovo/router'
import { appEnv } from '../config/env'

registerAppRouter({
    routes: import.meta.glob('./routes/modules/**/*.ts', { eager: false }) as AppRouteLoaders,
    pages: import.meta.glob('../views/**/*.vue'),
    history: appEnv.routerHistory,
    base: appEnv.base,
})
