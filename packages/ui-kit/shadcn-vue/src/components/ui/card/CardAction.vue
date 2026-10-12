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
    <Primitive data-slot="card-action" v-bind="forwarded" :class="cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', props.class)">
        <slot />
    </Primitive>
</template>