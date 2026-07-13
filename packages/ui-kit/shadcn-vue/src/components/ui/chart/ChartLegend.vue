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
            'flex gap-3 text-xs text-muted-foreground',
            vertical ? 'flex-col' : 'flex-wrap items-center',
            $props.class,
        )"
    >
        <li
            v-for="item in items"
            :key="item.label"
            class="inline-flex items-center gap-1.5"
        >
            <span
                class="size-2 shrink-0 rounded-full"
                :style="{ background: item.color }"
            />
            <span>{{ item.label }}</span>
        </li>
    </ul>
</template>
