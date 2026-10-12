<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { inject, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'
import { carouselContextKey } from './context'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
const context = inject(carouselContextKey)
const viewport = ref<HTMLElement | null>(null)
onMounted(() => context?.setViewport(viewport.value))
</script>

<template><div ref="viewport" data-slot="carousel-content" tabindex="0" :class="cn('overflow-auto scroll-smooth focus-visible:outline-none', props.class)"><div class="flex" :class="context?.orientation.value === 'vertical' ? 'flex-col' : 'flex-row'"><slot /></div></div></template>
