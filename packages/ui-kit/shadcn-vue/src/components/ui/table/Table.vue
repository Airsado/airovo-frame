<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { PrimitiveProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<PrimitiveProps & {
    class?: HTMLAttributes['class']
    withContainer?: boolean
}>(), { withContainer: true })
const forwarded = reactiveOmit(props, 'class', 'withContainer')
const tableClass = cn('w-full caption-bottom text-sm tabular-nums [&_td]:text-sm [&_td]:font-medium [&_th]:text-sm [&_:is(th,td)_*]:font-inherit', props.class)
</script>

<template>
    <div v-if="props.withContainer" data-slot="table-container" class="relative w-full overflow-x-auto overflow-y-hidden">
        <Primitive data-slot="table" v-bind="forwarded" as="table" :class="tableClass"><slot /></Primitive>
    </div>
    <Primitive v-else data-slot="table" v-bind="forwarded" as="table" :class="tableClass"><slot /></Primitive>
</template>