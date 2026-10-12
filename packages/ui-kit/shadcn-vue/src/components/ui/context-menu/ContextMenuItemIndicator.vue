<script setup lang="ts">
import type { ContextMenuItemIndicatorProps } from 'reka-ui'
import { ContextMenuItemIndicator, useForwardProps } from 'reka-ui'

const props = defineProps<ContextMenuItemIndicatorProps>()
const forwarded = useForwardProps(props)
</script>

<template>
    <ContextMenuItemIndicator data-slot="context-menu-item-indicator" v-bind="forwarded">
        <slot />
    </ContextMenuItemIndicator>
</template>
