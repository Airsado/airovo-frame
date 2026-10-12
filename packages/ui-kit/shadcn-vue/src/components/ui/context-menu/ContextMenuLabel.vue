<script setup lang="ts">
import type { ContextMenuLabelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ContextMenuLabel, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<ContextMenuLabelProps & { class?: HTMLAttributes['class']; inset?: boolean }>()
const forwarded = useForwardProps(reactiveOmit(props, 'class', 'inset'))
</script>

<template>
    <ContextMenuLabel
        data-slot="context-menu-label"
        :data-inset="props.inset ? '' : undefined"
        v-bind="forwarded"
        :class="cn('text-muted-foreground px-1.5 py-1 text-xs font-medium data-[inset]:pl-7', props.class)"
    >
        <slot />
    </ContextMenuLabel>
</template>
