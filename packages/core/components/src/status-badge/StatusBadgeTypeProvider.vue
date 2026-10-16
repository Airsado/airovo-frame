<script setup lang="ts">
import { toRef } from 'vue'
import type { StatusBadgeType } from './types'
import { provideStatusBadgeType } from './statusBadgeContext'

defineOptions({ name: 'StatusBadgeTypeProvider' })

const props = withDefaults(defineProps<{ type?: StatusBadgeType }>(), { type: 'badge' })

provideStatusBadgeType(toRef(props, 'type'))
</script>

<template>
    <slot />
</template>
