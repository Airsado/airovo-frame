import type { ComputedRef, InjectionKey, Ref } from 'vue'

export type CarouselOrientation = 'horizontal' | 'vertical'
export interface CarouselContext {
    orientation: Ref<CarouselOrientation>
    loop: Ref<boolean>
    currentIndex: Ref<number>
    count: Ref<number>
    canScrollPrev: ComputedRef<boolean>
    canScrollNext: ComputedRef<boolean>
    setViewport: (element: HTMLElement | null) => void
    refresh: () => void
    scrollTo: (index: number) => void
}
export const carouselContextKey: InjectionKey<CarouselContext> = Symbol('carousel')
