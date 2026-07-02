<script setup lang="ts">
defineOptions({ name: 'DashboardAnalytics' })
</script>

<template>
    <div class="space-y-4 p-4 sm:py-4" v-for="item in 4">
        <div class="rounded-md border bg-card p-6 text-card-foreground">
            <p class="text-sm text-muted-foreground">本周访问趋势</p>
            <div class="mt-4 flex h-32 items-end gap-2">
                <div
                    v-for="(value, idx) in [40, 65, 50, 78, 92, 70, 88]"
                    :key="idx"
                    class="flex-1 rounded-t bg-primary/80"
                    :style="{ height: value + '%' }"
                />
            </div>
            <div class="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>周一</span><span>周二</span><span>周三</span><span>周四</span>
                <span>周五</span><span>周六</span><span>周日</span>
            </div>
        </div>
    </div>
</template>
