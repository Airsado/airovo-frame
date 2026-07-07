<script lang="ts" setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { Skeleton } from '@airovo/uikit-shadcnui'

export type StatTrendDirection = 'up' | 'down' | 'flat'
export interface StatTrend {
    value: number
    direction: StatTrendDirection
    label?: string
    inverse?: boolean
}

const props = withDefaults(defineProps<{
    title: string
    value: string | number
    icon?: string
    trend?: StatTrend
    loading?: boolean
    formatter?: (value: string | number) => string | number
    class?: string
}>(), {
    loading: false,
})

const displayValue = computed(() => {
    if (props.loading) return ''
    return props.formatter ? props.formatter(props.value) : props.value
})

const trendIcon = computed(() => {
    if (!props.trend) return ''
    return props.trend.direction === 'up'
        ? 'lucide:trending-up'
        : props.trend.direction === 'down'
            ? 'lucide:trending-down'
            : 'lucide:minus'
})

const trendColor = computed(() => {
    if (!props.trend) return ''
    const isPositive = props.trend.inverse
        ? props.trend.direction === 'down'
        : props.trend.direction === 'up'
    return isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
})

const trendSign = computed(() => {
    if (!props.trend) return ''
    return props.trend.direction === 'up' ? '+' : props.trend.direction === 'down' ? '-' : ''
})
</script>

<template>
    <div
        class="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
        :class="props.class"
    >
        <div class="flex items-start justify-between gap-4">
            <div class="space-y-2">
                <Skeleton v-if="loading" class="h-4 w-24" />
                <p v-else class="text-sm text-muted-foreground">{{ title }}</p>
                <Skeleton v-if="loading" class="h-8 w-32" />
                <p v-else class="text-3xl font-bold tabular-nums">{{ displayValue }}</p>
                <p
                    v-if="trend && !loading"
                    :class="['inline-flex items-center gap-1 text-xs', trendColor]"
                >
                    <Icon :icon="trendIcon" class="size-3" />
                    <span>{{ trendSign }}{{ Math.abs(trend.value) }}%</span>
                    <span v-if="trend.label" class="text-muted-foreground">{{ trend.label }}</span>
                </p>
            </div>
            <div v-if="icon" class="flex size-10 items-center justify-center rounded-md bg-muted [&_svg]:size-5">
                <Icon :icon="icon" />
            </div>
        </div>
        <slot name="extra" />
    </div>
</template>
