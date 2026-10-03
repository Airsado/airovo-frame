import { defineComponent, h, markRaw, type Component } from 'vue'
import ModalHost from './ModalHost.vue'
import { ModalApi } from './modal-api'
import type { ModalOptions } from './types'

export function useModal<TData = unknown, TResult = unknown>(options: ModalOptions<TData, TResult> = {}): readonly [Component, ModalApi<TData, TResult>] {
    const api = new ModalApi<TData, TResult>(options)
    const Modal = markRaw(defineComponent({
        name: 'FrameworkModal',
        inheritAttrs: false,
        setup(_, { attrs, slots }) {
            return () => h(ModalHost, { ...attrs, api }, slots)
        },
    }))
    return [Modal, api] as const
}
