<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { MenubarRootEmits, MenubarRootProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { MenubarRoot, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<MenubarRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<MenubarRootEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
</script>

<template><MenubarRoot data-slot="menubar" v-bind="forwarded" :class="cn('flex h-8 items-center gap-0.5 rounded-lg border p-[3px]', props.class)"><slot /></MenubarRoot></template>