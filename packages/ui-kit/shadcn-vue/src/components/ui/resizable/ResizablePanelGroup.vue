<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, provide, ref } from 'vue'
import { cn } from '@/lib/utils'
import { resizableContextKey, type ResizableDirection } from './context'

const props = withDefaults(defineProps<{ class?: HTMLAttributes['class']; direction?: ResizableDirection }>(), { direction: 'horizontal' })
const direction = ref(props.direction)
provide(resizableContextKey, { direction })
const classes = computed(() => cn('flex h-full w-full', direction.value === 'vertical' ? 'flex-col' : 'flex-row', props.class))
</script>

<template><div data-slot="resizable-panel-group" :data-direction="direction" :class="classes"><slot /></div></template>