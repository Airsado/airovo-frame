<script setup lang="ts">
defineOptions({ name: 'DashboardOverview' })
</script>

<template>
    <div class="space-y-4 p-4 sm:p-0">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div class="rounded-md border bg-card p-4 text-card-foreground">
                <p class="text-sm text-muted-foreground">活跃用户</p>
                <p class="mt-2 text-2xl font-semibold">1,284</p>
            </div>
            <div class="rounded-md border bg-card p-4 text-card-foreground">
                <p class="text-sm text-muted-foreground">今日访问</p>
                <p class="mt-2 text-2xl font-semibold">9,421</p>
            </div>
            <div class="rounded-md border bg-card p-4 text-card-foreground">
                <p class="text-sm text-muted-foreground">转化率</p>
                <p class="mt-2 text-2xl font-semibold">3.2%</p>
            </div>
        </div>
    </div>
</template>
