<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { MenubarSubTriggerProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { MenubarSubTrigger } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<MenubarSubTriggerProps & { class?: HTMLAttributes['class'] }>()
const forwarded = reactiveOmit(props, 'class')
</script>

<template><MenubarSubTrigger data-slot="menubar-sub-trigger" v-bind="forwarded" :class="cn('focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm', props.class)"><slot /></MenubarSubTrigger></template>