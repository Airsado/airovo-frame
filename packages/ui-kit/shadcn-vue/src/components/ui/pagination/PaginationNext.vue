<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ChevronRight } from '@lucide/vue'
import { cn } from '@/lib/utils'
import PaginationLink from './PaginationLink.vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{ text?: string; class?: HTMLAttributes['class'] }>(), { text: 'Next' })
</script>

<template><PaginationLink v-bind="$attrs" size="default" aria-label="Go to next page" :class="cn('pr-1.5', props.class)"><span class="hidden sm:block">{{ props.text }}</span><ChevronRight class="size-4" aria-hidden="true" /></PaginationLink></template>