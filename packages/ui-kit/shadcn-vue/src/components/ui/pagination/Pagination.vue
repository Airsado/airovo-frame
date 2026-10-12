<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{ class?: HTMLAttributes['class'] }>(), {})
const forwarded = reactiveOmit(props, 'class')
</script>

<template><nav role="navigation" aria-label="pagination" data-slot="pagination" v-bind="forwarded" :class="cn('mx-auto flex w-full justify-center', props.class)"><slot /></nav></template>