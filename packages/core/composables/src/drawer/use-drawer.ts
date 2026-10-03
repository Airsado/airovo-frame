import { defineComponent, h, markRaw, type Component } from 'vue'
import DrawerHost from './DrawerHost.vue'
import { DrawerApi } from './drawer-api'
import type { DrawerOptions } from './types'

export function useDrawer<TData = unknown, TResult = unknown>(options: DrawerOptions<TData, TResult> = {}): readonly [Component, DrawerApi<TData, TResult>] {
    const api = new DrawerApi<TData, TResult>(options)
    const Drawer = markRaw(defineComponent({
        name: 'FrameworkDrawer',
        inheritAttrs: false,
        setup(_, { attrs, slots }) {
            return () => h(DrawerHost, { ...attrs, api }, slots)
        },
    }))
    return [Drawer, api] as const
}
