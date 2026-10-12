<script setup lang="ts">
import type { ContextMenuCheckboxItemEmits, ContextMenuCheckboxItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { CheckIcon } from '@radix-icons/vue'
import { reactiveOmit } from '@vueuse/core'
import { ContextMenuCheckboxItem, ContextMenuItemIndicator, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<ContextMenuCheckboxItemProps & { class?: HTMLAttributes['class']; inset?: boolean }>()
const emits = defineEmits<ContextMenuCheckboxItemEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class', 'inset'), emits)
</script>

<template>
    <ContextMenuCheckboxItem
        data-slot="context-menu-checkbox-item"
        :data-inset="props.inset ? '' : undefined"
        v-bind="forwarded"
        :class="cn('focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-7 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4', props.class)"
    >
        <span class="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
            <ContextMenuItemIndicator>
                <slot name="indicator-icon"><CheckIcon class="size-4" /></slot>
            </ContextMenuItemIndicator>
        </span>
        <slot />
    </ContextMenuCheckboxItem>
</template>
