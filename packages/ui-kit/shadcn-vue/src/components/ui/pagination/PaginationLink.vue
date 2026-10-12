<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, useAttrs } from 'vue'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
    isActive?: boolean
    size?: 'default' | 'sm' | 'lg' | 'icon'
    class?: HTMLAttributes['class']
}>(), { isActive: false, size: 'icon' })
const attrs = useAttrs()
const classes = computed(() => cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    props.size === 'default' && 'h-9 gap-1 px-3',
    props.size === 'sm' && 'h-8 gap-1 px-2.5',
    props.size === 'lg' && 'h-10 gap-1 px-8',
    props.size === 'icon' && 'size-9',
    props.isActive ? 'border bg-background shadow-sm' : 'hover:bg-muted hover:text-foreground',
    props.class,
))
</script>

<template><a data-slot="pagination-link" :data-active="props.isActive || undefined" v-bind="attrs" :aria-current="props.isActive ? 'page' : undefined" :class="classes"><slot /></a></template>
