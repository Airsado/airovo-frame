<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, inject } from 'vue'
import { cn } from '@/lib/utils'
import { resizableContextKey } from './context'

const props = defineProps<{ class?: HTMLAttributes['class']; defaultSize?: number; minSize?: number; maxSize?: number }>()
const context = inject(resizableContextKey)
const direction = computed(() => context?.direction.value ?? 'horizontal')
const style = computed(() => props.defaultSize === undefined ? undefined : { flexBasis: `${props.defaultSize}%` })
</script>

<template>
    <div
        data-slot="resizable-panel"
        :data-min-size="props.minSize"
        :data-max-size="props.maxSize"
        :style="style"
        :class="cn('min-h-0 min-w-0 flex-1', direction === 'vertical' ? 'w-full' : 'h-full', props.class)"
    >
        <slot />
    </div>
</template>