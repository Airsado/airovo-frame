<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, nextTick, onMounted, provide, ref } from 'vue'
import { cn } from '@/lib/utils'
import { resizableContextKey, type ResizableDirection } from './context'

const props = withDefaults(defineProps<{ class?: HTMLAttributes['class']; direction?: ResizableDirection; storageKey?: string }>(), { direction: 'horizontal' })
const direction = ref(props.direction)
const root = ref<HTMLElement>()
function panels(): HTMLElement[] {
    return root.value ? [...root.value.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]')] : []
}
function persist(): void {
    if (!props.storageKey || typeof window === 'undefined') return
    const sizes = panels().map((panel) => Number.parseFloat(panel.style.flexBasis))
    if (sizes.length === 0 || sizes.some((size) => !Number.isFinite(size))) return
    try { window.localStorage.setItem(props.storageKey, JSON.stringify(sizes)) } catch { /* optional storage */ }
}
function restore(): void {
    if (!props.storageKey || typeof window === 'undefined') return
    try {
        const value = JSON.parse(window.localStorage.getItem(props.storageKey) ?? 'null')
        const currentPanels = panels()
        if (!Array.isArray(value) || value.length !== currentPanels.length || value.some((size) => typeof size !== 'number' || !Number.isFinite(size) || size < 0 || size > 100)) return
        currentPanels.forEach((panel, index) => { panel.style.flexBasis = `${value[index]}%` })
    } catch { /* invalid persisted state falls back to defaults */ }
}
provide(resizableContextKey, { direction, persist })
const classes = computed(() => cn('flex h-full w-full', direction.value === 'vertical' ? 'flex-col' : 'flex-row', props.class))
onMounted(() => { void nextTick(restore) })
</script>

<template><div ref="root" data-slot="resizable-panel-group" :data-direction="direction" :class="classes"><slot /></div></template>
