<script setup lang="ts">
import type { MenubarRadioGroupEmits, MenubarRadioGroupProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { MenubarRadioGroup, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<MenubarRadioGroupProps>()
const emits = defineEmits<MenubarRadioGroupEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props), emits)
</script>

<template><MenubarRadioGroup data-slot="menubar-radio-group" v-bind="forwarded"><slot /></MenubarRadioGroup></template>