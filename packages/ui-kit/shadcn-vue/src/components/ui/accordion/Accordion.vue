<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { AccordionRootEmits, AccordionRootProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { AccordionRoot, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<AccordionRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<AccordionRootEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
</script>

<template>
    <AccordionRoot
        data-slot="accordion"
        v-bind="forwarded"
        :class="cn('w-full', props.class)"
    >
        <slot />
    </AccordionRoot>
</template>