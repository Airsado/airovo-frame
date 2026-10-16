<script setup lang="ts">
/**
 * ChartTooltip — shadcn-vue-styled tooltip body for chart hover.
 *
 * Usage: pass to Chart.js `options.plugins.tooltip.external` for full
 * control, or use the rendered HTML inside a default chart tooltip by
 * configuring `options.plugins.tooltip.callbacks`.
 */
defineProps<{
    label?: string
    payload?: Array<{ color: string; name: string; value: number | string }>
}>()

function formatValue(value: number | string): string {
    return typeof value === 'number' ? value.toLocaleString() : String(value)
}
</script>

<template>
    <div class="grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
        <p v-if="label" class="font-medium text-foreground">{{ label }}</p>
        <ul v-if="payload?.length" class="grid gap-1.5">
            <li
                v-for="(item, i) in payload"
                :key="i"
                class="flex w-full flex-wrap items-center gap-2"
            >
                <span
                    aria-hidden="true"
                    class="h-2.5 w-2.5 shrink-0 rounded-sm border"
                    :style="{ backgroundColor: item.color, borderColor: item.color }"
                />
                <div class="flex min-w-0 flex-1 items-center justify-between gap-2 leading-none">
                    <span class="min-w-0 truncate text-muted-foreground">{{ item.name }}</span>
                    <span class="shrink-0 text-foreground font-mono font-medium tabular-nums">{{ formatValue(item.value) }}</span>
                </div>
            </li>
        </ul>
    </div>
</template>
