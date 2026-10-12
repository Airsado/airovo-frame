<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { MenubarSeparatorProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { MenubarSeparator } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<MenubarSeparatorProps & { class?: HTMLAttributes['class'] }>()
const forwarded = reactiveOmit(props, 'class')
</script>

<template><MenubarSeparator data-slot="menubar-separator" v-bind="forwarded" :class="cn('bg-border -mx-1 my-1 h-px', props.class)" /></template>