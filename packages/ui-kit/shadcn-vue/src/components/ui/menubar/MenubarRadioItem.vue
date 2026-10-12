<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { MenubarRadioItemEmits, MenubarRadioItemProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { MenubarRadioItem, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<MenubarRadioItemProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<MenubarRadioItemEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
</script>

<template><MenubarRadioItem data-slot="menubar-radio-item" v-bind="forwarded" :class="cn('focus:bg-accent focus:text-accent-foreground relative flex items-center gap-1.5 rounded-md py-1 pr-1.5 pl-7 text-sm outline-none data-disabled:opacity-50', props.class)"><slot /></MenubarRadioItem></template>