<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ChevronLeft } from '@lucide/vue'
import { cn } from '@/lib/utils'
import PaginationLink from './PaginationLink.vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{ text?: string; class?: HTMLAttributes['class'] }>(), { text: 'Previous' })
</script>

<template><PaginationLink v-bind="$attrs" size="default" aria-label="Go to previous page" :class="cn('pl-1.5', props.class)"><ChevronLeft class="size-4" aria-hidden="true" /><span class="hidden sm:block">{{ props.text }}</span></PaginationLink></template>