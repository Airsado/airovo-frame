<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { MenubarLabelProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { MenubarLabel } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<MenubarLabelProps & { class?: HTMLAttributes['class'] }>()
const forwarded = reactiveOmit(props, 'class')
</script>

<template><MenubarLabel data-slot="menubar-label" v-bind="forwarded" :class="cn('px-1.5 py-1 text-sm font-medium', props.class)"><slot /></MenubarLabel></template>