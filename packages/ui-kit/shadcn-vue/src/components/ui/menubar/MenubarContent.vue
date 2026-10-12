<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { MenubarContentProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { MenubarContent, MenubarPortal } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<MenubarContentProps & { class?: HTMLAttributes['class'] }>(), { align: 'start', sideOffset: 8 })
const forwarded = reactiveOmit(props, 'class')
</script>

<template><MenubarPortal><MenubarContent data-slot="menubar-content" v-bind="forwarded" :class="cn('bg-popover text-popover-foreground min-w-36 rounded-lg p-1 shadow-md ring-1 ring-foreground/10', props.class)"><slot /></MenubarContent></MenubarPortal></template>