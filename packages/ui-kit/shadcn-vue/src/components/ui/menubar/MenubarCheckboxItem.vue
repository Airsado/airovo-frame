<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { MenubarCheckboxItemEmits, MenubarCheckboxItemProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { MenubarCheckboxItem, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<MenubarCheckboxItemProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<MenubarCheckboxItemEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
</script>

<template><MenubarCheckboxItem data-slot="menubar-checkbox-item" v-bind="forwarded" :class="cn('focus:bg-accent focus:text-accent-foreground relative flex items-center gap-1.5 rounded-md py-1 pr-1.5 pl-7 text-sm outline-none data-disabled:opacity-50', props.class)"><slot /></MenubarCheckboxItem></template>