<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { inject } from 'vue'
import { cn } from '@/lib/utils'
import { carouselContextKey } from './context'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
const context = inject(carouselContextKey)
</script>

<template><div role="group" aria-roledescription="slide" data-slot="carousel-item" :class="cn('min-w-0 shrink-0 grow-0 basis-full snap-start', context?.orientation.value === 'vertical' ? 'w-full' : 'h-full', props.class)"><slot /></div></template>