<script setup lang="ts">
import type { ContextMenuLabelProps } from 'reka-ui'
import { ContextMenuLabel } from 'reka-ui'
const props = defineProps<ContextMenuLabelProps>()
</script>
<template><ContextMenuLabel data-slot="context-menu-label" v-bind="props" class="px-2 py-1.5 text-xs font-semibold text-muted-foreground"><slot /></ContextMenuLabel></template>
