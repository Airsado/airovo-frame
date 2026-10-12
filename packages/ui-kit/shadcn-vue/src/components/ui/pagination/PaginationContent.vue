<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{ class?: HTMLAttributes['class'] }>(), {})
const forwarded = reactiveOmit(props, 'class')
</script>

<template><ul data-slot="pagination-content" v-bind="forwarded" :class="cn('flex items-center gap-0.5', props.class)"><slot /></ul></template>