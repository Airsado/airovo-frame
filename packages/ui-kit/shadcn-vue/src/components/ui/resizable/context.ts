import type { InjectionKey, Ref } from 'vue'

export type ResizableDirection = 'horizontal' | 'vertical'
export interface ResizableContext {
    direction: Ref<ResizableDirection>
}
export const resizableContextKey: InjectionKey<ResizableContext> = Symbol('resizable')