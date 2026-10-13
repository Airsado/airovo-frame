import type { InjectionKey, Ref } from 'vue'

export type ResizableDirection = 'horizontal' | 'vertical'
export interface ResizableContext {
    direction: Ref<ResizableDirection>
    persist?: () => void
}
export const resizableContextKey: InjectionKey<ResizableContext> = Symbol('resizable')
