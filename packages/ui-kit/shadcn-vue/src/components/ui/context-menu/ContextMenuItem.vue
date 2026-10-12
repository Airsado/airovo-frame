<script setup lang="ts">
import type { ContextMenuItemProps } from 'reka-ui'
import { ContextMenuItem } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cn } from '@/lib/utils'
const props = defineProps<ContextMenuItemProps & { class?: HTMLAttributes['class'] }>()
const forwarded = reactiveOmit(props, 'class')
</script>
<template><ContextMenuItem data-slot="context-menu-item" v-bind="forwarded" :class="cn('focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50', props.class)"><slot /></ContextMenuItem></template>
