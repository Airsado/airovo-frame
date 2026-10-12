<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { PrimitiveProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<PrimitiveProps & { class?: HTMLAttributes['class'] }>()
const forwarded = reactiveOmit(props, 'class')
</script>

<template><Primitive data-slot="table-footer" v-bind="forwarded" as="tfoot" :class="cn('bg-muted/50 border-t font-medium [&>tr]:last:border-b-0', props.class)"><slot /></Primitive></template>