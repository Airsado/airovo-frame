<script setup lang="ts">
/**
 * ChartLegend — shadcn-vue-styled legend strip. Pair with
 * `options.plugins.legend.display = false` on the chart and render
 * this below the chart for full control over layout.
 */
import { Icon } from '@iconify/vue'
import { cn } from '@/lib/utils'

defineProps<{
    items: Array<{ label: string; color: string }>
    vertical?: boolean
    class?: string
}>()
</script>

<template>
    <ul
        :class="cn(
            'flex items-center justify-center gap-4 text-xs text-muted-foreground',
            vertical ? 'flex-col items-start' : 'flex-wrap',
            $props.class,
        )"
    >
        <li
            v-for="item in items"
            :key="item.label"
            class="inline-flex items-center gap-1.5"
        >
            <span
                aria-hidden="true"
                class="h-2 w-2 shrink-0 rounded-sm"
                :style="{ background: item.color }"
            />
            <span>{{ item.label }}</span>
        </li>
    </ul>
</template>
