<script setup lang="ts">
import { Icon } from '@airovo/shared/icons'

defineOptions({ name: 'DashboardOverview' })

const stats = [
    { label: '活跃用户', value: '1,284', icon: 'lucide:users', trend: '+12.4%', up: true },
    { label: '今日访问', value: '9,421', icon: 'lucide:eye', trend: '+5.1%', up: true },
    { label: '转化率', value: '3.2%', icon: 'lucide:trending-up', trend: '-0.8%', up: false },
    { label: '总收入', value: '¥48.2K', icon: 'lucide:wallet', trend: '+18.6%', up: true },
]

const activities = [
    { user: '庄周', action: '部署了新版本 v0.1.0', time: '2 分钟前', icon: 'lucide:rocket' },
    { user: '李白', action: '更新了 API 文档', time: '15 分钟前', icon: 'lucide:file-text' },
    { user: '苏轼', action: '修复了登录页样式', time: '1 小时前', icon: 'lucide:bug' },
    { user: '王维', action: '新增了数据导出功能', time: '3 小时前', icon: 'lucide:download' },
]
</script>

<template>
    <div class="space-y-6 p-4 sm:p-6">
        <!-- Welcome banner -->
        <div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/90 via-primary to-primary/70 p-6 text-white shadow-lg">
            <div class="relative z-10">
                <h2 class="text-xl font-bold tracking-tight">欢迎回来 👋</h2>
                <p class="mt-1 text-sm opacity-90">今天是充满可能性的一天，让我们开始吧。</p>
            </div>
            <div class="absolute -right-8 -top-8 size-32 rounded-full bg-white/10" />
            <div class="absolute -right-4 -bottom-12 size-24 rounded-full bg-white/5" />
        </div>

        <!-- Stats grid -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
                v-for="stat in stats"
                :key="stat.label"
                class="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
                <div class="flex items-start justify-between">
                    <div>
                        <p class="text-sm text-muted-foreground">{{ stat.label }}</p>
                        <p class="mt-2 text-2xl font-bold tracking-tight">{{ stat.value }}</p>
                    </div>
                    <div class="flex size-10 items-center justify-center rounded-lg bg-primary/5 text-primary transition-colors group-hover:bg-primary/10">
                        <Icon :icon="stat.icon" class="size-5" />
                    </div>
                </div>
                <div class="mt-3 flex items-center gap-1 text-xs">
                    <Icon
                        :icon="stat.up ? 'lucide:trending-up' : 'lucide:trending-down'"
                        :class="stat.up ? 'text-emerald-500' : 'text-red-500'"
                    />
                    <span :class="stat.up ? 'text-emerald-500' : 'text-red-500'">{{ stat.trend }}</span>
                    <span class="text-muted-foreground">较上周</span>
                </div>
            </div>
        </div>

        <!-- Activity feed -->
        <div class="rounded-xl border bg-card shadow-sm">
            <div class="border-b px-5 py-4">
                <h3 class="text-base font-semibold">最近动态</h3>
            </div>
            <div class="divide-y">
                <div
                    v-for="(activity, i) in activities"
                    :key="i"
                    class="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30"
                >
                    <div class="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon :icon="activity.icon" class="size-4 text-muted-foreground" />
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="text-sm">
                            <span class="font-medium">{{ activity.user }}</span>
                            <span class="text-muted-foreground"> {{ activity.action }}</span>
                        </p>
                    </div>
                    <span class="shrink-0 text-xs text-muted-foreground">{{ activity.time }}</span>
                </div>
            </div>
        </div>
    </div>
</template>
