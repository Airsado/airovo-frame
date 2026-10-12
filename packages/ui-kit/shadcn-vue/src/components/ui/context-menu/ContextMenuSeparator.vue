<script setup lang="ts">
import type { ContextMenuSeparatorProps } from 'reka-ui'
import { ContextMenuSeparator } from 'reka-ui'
const props = defineProps<ContextMenuSeparatorProps>()
</script>
<template><ContextMenuSeparator data-slot="context-menu-separator" v-bind="props" class="bg-border -mx-1 my-1 h-px" /></template>
