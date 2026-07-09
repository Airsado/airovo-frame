<script setup lang="ts">
import { Icon } from '@airovo/shared/icons'

defineOptions({ name: 'DashboardAnalytics' })

const weekData = [
    { day: '周一', value: 40, label: '1.2K' },
    { day: '周二', value: 65, label: '1.8K' },
    { day: '周三', value: 50, label: '1.4K' },
    { day: '周四', value: 78, label: '2.1K' },
    { day: '周五', value: 92, label: '2.6K' },
    { day: '周六', value: 70, label: '1.9K' },
    { day: '周日', value: 88, label: '2.4K' },
]

const topPages = [
    { path: '/dashboard/overview', visits: '4,829', pct: '32%' },
    { path: '/dashboard/analytics', visits: '3,211', pct: '21%' },
    { path: '/dashboard/components', visits: '2,156', pct: '14%' },
    { path: '/dashboard/aform', visits: '1,872', pct: '12%' },
    { path: '/dashboard/design', visits: '1,340', pct: '9%' },
]

const sources = [
    { name: '直接访问', pct: 42, color: 'bg-primary' },
    { name: '搜索引擎', pct: 28, color: 'bg-emerald-500' },
    { name: '社交媒体', pct: 18, color: 'bg-amber-500' },
    { name: '其他', pct: 12, color: 'bg-muted-foreground' },
]
</script>

<template>
    <div class="space-y-6 p-4 sm:p-6">
        <!-- Chart card -->
        <div class="rounded-xl border bg-card p-6">
            <div class="mb-6 flex items-center justify-between">
                <div>
                    <h3 class="text-base font-semibold">本周访问趋势</h3>
                    <p class="mt-0.5 text-sm text-muted-foreground">总计 13.4K 次访问</p>
                </div>
                <div class="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
                    <Icon icon="lucide:trending-up" class="size-3" />
                    +24.3%
                </div>
            </div>
            <div class="flex h-40 items-end gap-3">
                <div
                    v-for="(item, idx) in weekData"
                    :key="idx"
                    class="group flex flex-1 flex-col items-center gap-2"
                >
                    <span class="text-xs font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        {{ item.label }}
                    </span>
                    <div
                        class="w-full rounded-t-lg bg-gradient-to-t from-primary/60 to-primary transition-all duration-300 hover:from-primary hover:to-primary/80"
                        :style="{ height: item.value + '%' }"
                    />
                    <span class="text-xs text-muted-foreground">{{ item.day }}</span>
                </div>
            </div>
        </div>

        <!-- Two columns -->
        <div class="grid gap-4 lg:grid-cols-2">
            <!-- Top pages -->
            <div class="rounded-xl border bg-card p-6">
                <h3 class="mb-4 text-base font-semibold">热门页面</h3>
                <div class="space-y-3">
                    <div
                        v-for="(page, i) in topPages"
                        :key="i"
                        class="flex items-center gap-3"
                    >
                        <span class="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                            {{ i + 1 }}
                        </span>
                        <code class="min-w-0 flex-1 truncate text-sm">{{ page.path }}</code>
                        <span class="shrink-0 text-sm font-medium">{{ page.visits }}</span>
                        <span class="w-10 shrink-0 text-right text-xs text-muted-foreground">{{ page.pct }}</span>
                    </div>
                </div>
            </div>

            <!-- Traffic sources -->
            <div class="rounded-xl border bg-card p-6">
                <h3 class="mb-4 text-base font-semibold">流量来源</h3>
                <div class="space-y-4">
                    <div v-for="src in sources" :key="src.name">
                        <div class="mb-1.5 flex items-center justify-between text-sm">
                            <span>{{ src.name }}</span>
                            <span class="font-medium">{{ src.pct }}%</span>
                        </div>
                        <div class="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                                class="h-full rounded-full transition-all duration-500"
                                :class="src.color"
                                :style="{ width: src.pct + '%' }"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
