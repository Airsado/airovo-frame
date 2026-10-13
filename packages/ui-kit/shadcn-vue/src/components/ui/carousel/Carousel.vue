<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { carouselContextKey, type CarouselOrientation } from './context'

const props = withDefaults(defineProps<{ class?: HTMLAttributes['class']; orientation?: CarouselOrientation; loop?: boolean; autoplayInterval?: number }>(), { orientation: 'horizontal', loop: false, autoplayInterval: 0 })
const orientation = ref(props.orientation)
const loop = ref(props.loop)
const viewport = ref<HTMLElement | null>(null)
const root = ref<HTMLElement | null>(null)
const paused = ref(false)
let autoplayTimer: ReturnType<typeof setInterval> | undefined
const currentIndex = ref(0)
const count = ref(0)
const canScrollPrev = computed(() => loop.value ? count.value > 1 : currentIndex.value > 0)
const canScrollNext = computed(() => loop.value ? count.value > 1 : currentIndex.value < count.value - 1)
function setViewport(element: HTMLElement | null): void { viewport.value = element }
function refresh(): void { count.value = viewport.value?.querySelectorAll('[data-slot="carousel-item"]').length ?? 0 }
function scrollTo(index: number): void {
    const nextIndex = loop.value && count.value > 0
        ? ((index % count.value) + count.value) % count.value
        : Math.min(Math.max(0, index), Math.max(0, count.value - 1))
    const item = viewport.value?.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]')[nextIndex]
    if (!item || !viewport.value) return
    const offset = orientation.value === 'horizontal' ? item.offsetLeft : item.offsetTop
    viewport.value.scrollTo({ [orientation.value === 'horizontal' ? 'left' : 'top']: offset, behavior: 'smooth' })
    currentIndex.value = nextIndex
    restartAutoplay()
}
function onScroll(): void {
    if (!viewport.value || !count.value) return
    const offset = orientation.value === 'horizontal' ? viewport.value.scrollLeft : viewport.value.scrollTop
    const size = orientation.value === 'horizontal' ? viewport.value.clientWidth : viewport.value.clientHeight
    if (size) currentIndex.value = Math.min(count.value - 1, Math.max(0, Math.round(offset / size)))
}
function onKeydown(event: KeyboardEvent): void {
    const previous = orientation.value === 'horizontal' ? event.key === 'ArrowLeft' : event.key === 'ArrowUp'
    const next = orientation.value === 'horizontal' ? event.key === 'ArrowRight' : event.key === 'ArrowDown'
    if (!previous && !next) return
    event.preventDefault()
    scrollTo(currentIndex.value + (next ? 1 : -1))
}
function clearAutoplay(): void {
    if (autoplayTimer) clearInterval(autoplayTimer)
    autoplayTimer = undefined
}
function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}
function restartAutoplay(): void {
    clearAutoplay()
    if (!props.loop || !props.autoplayInterval || props.autoplayInterval <= 0 || prefersReducedMotion()) return
    autoplayTimer = setInterval(() => {
        if (!paused.value) scrollTo(currentIndex.value + 1)
    }, props.autoplayInterval)
}
function onFocusOut(event: FocusEvent): void {
    if (!root.value?.contains(event.relatedTarget as Node | null)) paused.value = false
}
provide(carouselContextKey, { orientation, loop, currentIndex, count, canScrollPrev, canScrollNext, setViewport, refresh, scrollTo })
onMounted(() => nextTick(() => { refresh(); restartAutoplay() }))
watch(() => [props.loop, props.autoplayInterval] as const, restartAutoplay)
onBeforeUnmount(clearAutoplay)
</script>

<template><div ref="root" role="region" aria-roledescription="carousel" data-slot="carousel" :data-current-index="currentIndex" :class="cn('relative', props.class)" @keydown="onKeydown" @mouseenter="paused = true" @mouseleave="paused = false" @focusin="paused = true" @focusout="onFocusOut"><slot /></div></template>
