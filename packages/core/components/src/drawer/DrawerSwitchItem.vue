<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

defineOptions({ name: 'DrawerSwitchItem' })

const props = defineProps<{
    class?: HTMLAttributes['class']
}>()
</script>

<template>
    <div :class="['flex min-h-16 flex-row items-center justify-between gap-3 border-y border-border/60 py-3', props.class]">
        <div class="min-w-0 flex-1"><slot /></div>
        <div v-if="$slots.control" class="shrink-0"><slot name="control" /></div>
    </div>
</template>
