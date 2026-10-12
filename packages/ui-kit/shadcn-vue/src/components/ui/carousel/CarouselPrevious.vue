<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'
import { inject } from 'vue'
import { carouselContextKey } from './context'

const context = inject(carouselContextKey)
</script>

<template><button type="button" data-slot="carousel-previous" aria-label="Previous slide" :disabled="!context?.canScrollPrev.value" class="absolute left-2 top-1/2 z-10 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full border bg-background shadow-sm disabled:pointer-events-none disabled:opacity-50" @click="context?.scrollTo(context.currentIndex.value - 1)"><ChevronLeft class="size-4" aria-hidden="true" /><span class="sr-only">Previous slide</span></button></template>