<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, inject, onBeforeUnmount, ref } from 'vue'
import { cn } from '@/lib/utils'
import { resizableContextKey } from './context'

const props = withDefaults(defineProps<{ class?: HTMLAttributes['class']; withHandle?: boolean }>(), { withHandle: false })
const context = inject(resizableContextKey)
const direction = computed(() => context?.direction.value ?? 'horizontal')
const handle = ref<HTMLElement>()
let cleanup: (() => void) | undefined

function panels(): [HTMLElement, HTMLElement] | undefined {
    const current = handle.value
    if (!current) return undefined
    const previous = current.previousElementSibling as HTMLElement | null
    const next = current.nextElementSibling as HTMLElement | null
    if (!previous?.matches('[data-slot="resizable-panel"]') || !next?.matches('[data-slot="resizable-panel"]')) return undefined
    return [previous, next]
}

function resize(delta: number, total: number): void {
    const pair = panels()
    if (!pair) return
    const [previous, next] = pair
    const previousStart = Number(previous.dataset.startSize ?? previous.getBoundingClientRect()[direction.value === 'horizontal' ? 'width' : 'height'])
    const nextStart = Number(next.dataset.startSize ?? next.getBoundingClientRect()[direction.value === 'horizontal' ? 'width' : 'height'])
    const previousMin = Number(previous.dataset.minSize ?? 0) / 100 * total
    const previousMax = Number(previous.dataset.maxSize ?? 100) / 100 * total
    const nextMin = Number(next.dataset.minSize ?? 0) / 100 * total
    const nextMax = Number(next.dataset.maxSize ?? 100) / 100 * total
    const nextPrevious = Math.min(previousMax, Math.max(previousMin, previousStart + delta))
    const nextNext = total - nextPrevious
    if (nextNext < nextMin || nextNext > nextMax) return
    previous.style.flexBasis = `${nextPrevious / total * 100}%`
    next.style.flexBasis = `${nextNext / total * 100}%`
}

function startDrag(event: PointerEvent): void {
    if (event.button !== 0) return
    const pair = panels()
    if (!pair) return
    const axis = direction.value === 'horizontal' ? 'clientX' : 'clientY'
    const size = direction.value === 'horizontal' ? 'width' : 'height'
    const total = pair[0].parentElement?.getBoundingClientRect()[size] ?? 0
    pair[0].dataset.startSize = String(pair[0].getBoundingClientRect()[size])
    pair[1].dataset.startSize = String(pair[1].getBoundingClientRect()[size])
    const start = event[axis]
    const move = (moveEvent: PointerEvent) => resize(moveEvent[axis] - start, total)
    const stop = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', stop); cleanup = undefined; context?.persist?.() }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', stop, { once: true })
    cleanup = stop
    event.preventDefault()
}

function onKeydown(event: KeyboardEvent): void {
    const horizontal = direction.value === 'horizontal'
    const increase = horizontal ? event.key === 'ArrowRight' : event.key === 'ArrowDown'
    const decrease = horizontal ? event.key === 'ArrowLeft' : event.key === 'ArrowUp'
    if (!increase && !decrease) return
    const pair = panels()
    if (!pair) return
    const size = horizontal ? 'width' : 'height'
    const total = pair[0].parentElement?.getBoundingClientRect()[size] ?? 100
    const current = pair[0].getBoundingClientRect()[size]
    resize(increase ? total * 0.05 : -total * 0.05, total)
    context?.persist?.()
    event.preventDefault()
    void current
}

onBeforeUnmount(() => cleanup?.())
</script>

<template>
    <div
        ref="handle"
        data-slot="resizable-handle"
        role="separator"
        tabindex="0"
        :aria-orientation="direction === 'horizontal' ? 'vertical' : 'horizontal'"
        :class="cn('bg-border focus-visible:ring-ring relative flex shrink-0 items-center justify-center focus-visible:outline-none focus-visible:ring-1', direction === 'horizontal' ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize', props.class)"
        @pointerdown="startDrag"
        @keydown="onKeydown"
    >
        <div v-if="props.withHandle" class="bg-border z-10 flex rounded-lg" :class="direction === 'horizontal' ? 'h-6 w-1' : 'h-1 w-6'" />
    </div>
</template>
