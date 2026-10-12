<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { MenubarSubContentEmits, MenubarSubContentProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { MenubarSubContent, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<MenubarSubContentProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<MenubarSubContentEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
</script>

<template><MenubarSubContent data-slot="menubar-sub-content" v-bind="forwarded" :class="cn('bg-popover text-popover-foreground min-w-32 rounded-lg p-1 shadow-lg ring-1 ring-foreground/10', props.class)"><slot /></MenubarSubContent></template>