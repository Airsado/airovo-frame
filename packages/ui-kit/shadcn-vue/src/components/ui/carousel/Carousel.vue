<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, nextTick, onMounted, provide, ref } from 'vue'
import { cn } from '@/lib/utils'
import { carouselContextKey, type CarouselOrientation } from './context'

const props = withDefaults(defineProps<{ class?: HTMLAttributes['class']; orientation?: CarouselOrientation }>(), { orientation: 'horizontal' })
const orientation = ref(props.orientation)
const viewport = ref<HTMLElement | null>(null)
const currentIndex = ref(0)
const count = ref(0)
const canScrollPrev = computed(() => currentIndex.value > 0)
const canScrollNext = computed(() => currentIndex.value < count.value - 1)
function setViewport(element: HTMLElement | null): void { viewport.value = element }
function refresh(): void { count.value = viewport.value?.querySelectorAll('[data-slot="carousel-item"]').length ?? 0 }
function scrollTo(index: number): void {
    const nextIndex = Math.min(Math.max(0, index), Math.max(0, count.value - 1))
    const item = viewport.value?.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]')[nextIndex]
    if (!item || !viewport.value) return
    const offset = orientation.value === 'horizontal' ? item.offsetLeft : item.offsetTop
    viewport.value.scrollTo({ [orientation.value === 'horizontal' ? 'left' : 'top']: offset, behavior: 'smooth' })
    currentIndex.value = nextIndex
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
provide(carouselContextKey, { orientation, currentIndex, count, canScrollPrev, canScrollNext, setViewport, refresh, scrollTo })
onMounted(() => nextTick(refresh))
</script>

<template><div role="region" aria-roledescription="carousel" data-slot="carousel" :class="cn('relative', props.class)" @keydown="onKeydown"><slot /></div></template>