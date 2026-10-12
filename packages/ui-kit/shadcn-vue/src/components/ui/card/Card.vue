<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { PrimitiveProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<PrimitiveProps & {
    class?: HTMLAttributes['class']
    size?: 'default' | 'sm'
}>(), { size: 'default' })
const forwarded = reactiveOmit(props, 'class', 'size')
</script>

<template>
    <Primitive
        data-slot="card"
        :data-size="props.size"
        v-bind="forwarded"
        :class="cn('group/card bg-card text-card-foreground ring-foreground/10 flex flex-col gap-4 overflow-hidden rounded-xl py-4 text-sm ring-1 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl', props.class)"
    >
        <slot />
    </Primitive>
</template>