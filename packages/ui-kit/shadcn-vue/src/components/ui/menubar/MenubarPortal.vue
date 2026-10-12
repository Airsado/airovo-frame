<script setup lang="ts">
import type { MenubarPortalProps } from 'reka-ui'
import { MenubarPortal } from 'reka-ui'

const props = defineProps<MenubarPortalProps>()
</script>

<template><MenubarPortal data-slot="menubar-portal" v-bind="props"><slot /></MenubarPortal></template>