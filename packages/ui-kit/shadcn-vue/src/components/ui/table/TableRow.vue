<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { PrimitiveProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<PrimitiveProps & { class?: HTMLAttributes['class'] }>()
const forwarded = reactiveOmit(props, 'class')
</script>

<template><Primitive data-slot="table-row" v-bind="forwarded" as="tr" :class="cn('group data-[state=selected]:bg-muted border-b transition-colors hover:bg-muted/50', props.class)"><slot /></Primitive></template>