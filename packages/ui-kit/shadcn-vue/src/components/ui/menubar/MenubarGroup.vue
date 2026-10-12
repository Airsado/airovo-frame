<script setup lang="ts">
import type { MenubarGroupProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { MenubarGroup } from 'reka-ui'

const props = defineProps<MenubarGroupProps>()
const forwarded = reactiveOmit(props)
</script>

<template><MenubarGroup data-slot="menubar-group" v-bind="forwarded"><slot /></MenubarGroup></template>