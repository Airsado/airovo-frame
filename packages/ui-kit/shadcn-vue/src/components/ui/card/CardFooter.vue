<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { PrimitiveProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<PrimitiveProps & { class?: HTMLAttributes['class'] }>()
const forwarded = reactiveOmit(props, 'class')
</script>

<template>
    <Primitive data-slot="card-footer" v-bind="forwarded" :class="cn('bg-muted/50 flex items-center rounded-b-xl border-t p-4 group-data-[size=sm]/card:p-3', props.class)">
        <slot />
    </Primitive>
</template>