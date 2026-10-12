<script setup lang="ts">
import type { MenubarSubEmits, MenubarSubProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { MenubarSub, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<MenubarSubProps>()
const emits = defineEmits<MenubarSubEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props), emits)
</script>

<template><MenubarSub data-slot="menubar-sub" v-bind="forwarded"><slot /></MenubarSub></template>