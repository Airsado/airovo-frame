<script setup lang="ts">
import TruncatedCell from './TruncatedCell.vue'

defineOptions({ name: 'TruncatedText' })

withDefaults(defineProps<{
    text: string
    maxWidth?: string
    side?: 'top' | 'bottom' | 'left' | 'right'
    class?: string
}>(), {
    maxWidth: 'max-w-[200px]',
    side: 'top',
})
</script>

<template>
    <TruncatedCell :text="text" :side="side" :class="[maxWidth, $props.class].filter(Boolean).join(' ')" />
</template>
