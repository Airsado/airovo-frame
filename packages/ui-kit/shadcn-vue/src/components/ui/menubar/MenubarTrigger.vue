<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { MenubarTriggerProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { MenubarTrigger } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<MenubarTriggerProps & { class?: HTMLAttributes['class'] }>()
const forwarded = reactiveOmit(props, 'class')
</script>

<template><MenubarTrigger data-slot="menubar-trigger" v-bind="forwarded" :class="cn('hover:bg-muted aria-expanded:bg-muted flex items-center rounded-sm px-1.5 py-[2px] text-sm font-medium outline-none select-none', props.class)"><slot /></MenubarTrigger></template>