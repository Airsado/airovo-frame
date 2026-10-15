<script setup lang="ts">
/**
 * ChartContainer — a thin shadcn-vue wrapper around vue-chartjs
 * (which itself wraps Chart.js). Renders line / bar / pie / doughnut /
 * radar with theme colors pulled from the shadcn-vue CSS variables
 * (--color-chart-1 … --color-chart-5).
 *
 * API intentionally matches the official shadcn-vue chart registry
 * component so it's a drop-in replacement.
 */
import { computed } from 'vue'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js'
import { Line, Bar, Pie, Doughnut, Radar } from 'vue-chartjs'
import { resolveChartColors, type ChartConfig, type ChartSeriesConfigMap } from './ChartPlugin'
import { cn } from '@/lib/utils'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler,
)

const props = withDefaults(defineProps<{
    type: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar'
    data: ChartConfig['data']
    options?: ChartConfig['options']
    config?: ChartSeriesConfigMap
    class?: string
    height?: number | string
}>(), {
    type: 'line',
    height: 300,
})

const CompMap = { line: Line, bar: Bar, pie: Pie, doughnut: Doughnut, radar: Radar } as const

const chartData = computed(() => resolveChartColors(props.data as any, props.config))
const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    ...props.options,
}))
</script>

<template>
    <div
        :class="cn('relative w-full', props.class)"
        :style="{ height: typeof height === 'number' ? `${height}px` : (height as string) }"
    >
        <component
            :is="CompMap[type]"
            :data="chartData"
            :options="chartOptions"
        />
    </div>
</template>
