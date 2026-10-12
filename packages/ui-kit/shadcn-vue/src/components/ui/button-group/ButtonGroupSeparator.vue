<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{ class?: HTMLAttributes['class']; orientation?: 'horizontal' | 'vertical' }>(), { orientation: 'vertical' })
</script>

<template><div role="separator" data-slot="button-group-separator" :data-orientation="props.orientation" :class="cn('bg-input relative self-stretch', props.orientation === 'horizontal' ? 'my-px h-auto' : 'mx-px w-auto', props.class)" /></template>