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
    <Primitive data-slot="card-content" v-bind="forwarded" :class="cn('px-4 group-data-[size=sm]/card:px-3', props.class)">
        <slot />
    </Primitive>
</template>