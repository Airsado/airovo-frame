<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { MenubarItemProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { MenubarItem } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<MenubarItemProps & { class?: HTMLAttributes['class'] }>()
const forwarded = reactiveOmit(props, 'class')
</script>

<template><MenubarItem data-slot="menubar-item" v-bind="forwarded" :class="cn('focus:bg-accent focus:text-accent-foreground flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-none data-disabled:opacity-50', props.class)"><slot /></MenubarItem></template>