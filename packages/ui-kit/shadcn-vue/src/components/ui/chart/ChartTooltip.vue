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
</script>

<template>
    <div class="rounded-md border bg-card px-2.5 py-1.5 text-xs shadow-md">
        <p v-if="label" class="font-medium text-foreground">{{ label }}</p>
        <ul v-if="payload?.length" class="mt-1 space-y-0.5">
            <li
                v-for="(item, i) in payload"
                :key="i"
                class="flex items-center gap-2"
            >
                <span
                    class="size-2 shrink-0 rounded-full"
                    :style="{ background: item.color }"
                />
                <span class="flex-1 truncate text-muted-foreground">{{ item.name }}</span>
                <span class="font-mono">{{ item.value }}</span>
            </li>
        </ul>
    </div>
</template>
