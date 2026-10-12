<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@airovo/shared/icons'
import { ChartContainer, ChartLegend, Button, Skeleton } from '@airovo/uikit-shadcnui'
import type { ChartLegendItem, ChartTooltipItem, FrameworkChartData, FrameworkChartOptions, FrameworkChartType } from './types'

defineOptions({ name: 'ChartCard' })

const props = withDefaults(defineProps<{
    title: string
    description?: string
    type?: FrameworkChartType
    data?: FrameworkChartData
    options?: FrameworkChartOptions
    height?: number | string
    loading?: boolean
    error?: unknown
    empty?: boolean
    errorText?: string
    emptyText?: string
    legend?: ChartLegendItem[]
    tooltipLabel?: string
    tooltipItems?: ChartTooltipItem[]
    class?: string
}>(), {
    type: 'line',
    height: 280,
    loading: false,
    empty: false,
    errorText: '图表加载失败',
    emptyText: '暂无图表数据',
})

const emit = defineEmits<{ (event: 'retry'): void }>()
const hasChartData = computed(() => Boolean(props.data?.datasets?.some((dataset) => Array.isArray(dataset.data) && dataset.data.length > 0)))
const isEmpty = computed(() => props.empty || !hasChartData.value)
const chartData = computed<FrameworkChartData>(() => props.data ?? { datasets: [] })
</script>

<template>
    <section :class="['min-w-0 overflow-hidden rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5', props.class]" :aria-busy="loading">
        <header class="flex min-w-0 items-start justify-between gap-3">
            <div class="min-w-0">
                <h3 class="truncate text-sm font-semibold text-card-foreground">{{ title }}</h3>
                <p v-if="description" class="mt-1 text-xs text-muted-foreground">{{ description }}</p>
            </div>
            <slot name="actions" />
        </header>

        <div v-if="loading" role="status" aria-live="polite" aria-label="正在加载图表" class="mt-4 space-y-3">
            <Skeleton class="h-56 w-full" />
        </div>
        <div v-else-if="error" role="alert" class="mt-4 flex min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
            <Icon icon="lucide:triangle-alert" class="size-7 text-destructive" />
            <p class="text-sm text-destructive">{{ errorText }}</p>
            <Button type="button" size="sm" variant="outline" @click="emit('retry')">重试</Button>
        </div>
        <div v-else-if="isEmpty" role="status" aria-live="polite" class="mt-4 flex min-h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
            <Icon icon="lucide:chart-no-axes-combined" class="size-7 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">{{ emptyText }}</p>
        </div>
        <template v-else>
            <ChartContainer class="mt-4" :type="type" :data="chartData" :options="options" :height="height" :aria-label="title" role="img" />
            <ChartLegend v-if="legend?.length" class="mt-3" :items="legend" />
            <slot v-if="$slots.tooltip" name="tooltip" :label="tooltipLabel" :items="tooltipItems ?? []" />
        </template>
        <slot name="footer" />
    </section>
</template>
