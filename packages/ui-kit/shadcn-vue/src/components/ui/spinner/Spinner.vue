<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, useAttrs } from 'vue'
import { LoaderCircle } from '@lucide/vue'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
    class?: HTMLAttributes['class']
    strokeWidth?: number
}>(), { strokeWidth: 2 })
const attrs = useAttrs()
const label = computed(() => typeof attrs['aria-label'] === 'string' ? attrs['aria-label'] : 'Loading')
</script>

<template>
    <LoaderCircle
        v-bind="$attrs"
        role="status"
        :aria-label="label"
        :stroke-width="props.strokeWidth"
        :class="cn('size-4 animate-spin', props.class)"
    />
</template>
