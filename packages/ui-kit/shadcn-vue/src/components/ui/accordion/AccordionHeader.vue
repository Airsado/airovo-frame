<script setup lang="ts">
import type { AccordionHeaderProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AccordionHeader } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<AccordionHeaderProps & { class?: HTMLAttributes['class'] }>()
const forwarded = reactiveOmit(props, 'class')
</script>

<template>
    <AccordionHeader
        data-slot="accordion-header"
        v-bind="forwarded"
        :class="cn('flex', props.class)"
    >
        <slot />
    </AccordionHeader>
</template>