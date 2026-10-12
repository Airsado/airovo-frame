<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{ class?: HTMLAttributes['class'] }>(), {})
const forwarded = reactiveOmit(props, 'class')
</script>

<template><li data-slot="pagination-item" v-bind="forwarded" :class="cn(props.class)"><slot /></li></template>