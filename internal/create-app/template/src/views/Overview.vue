<script setup lang="ts">
defineOptions({ name: 'Overview' })
</script>

<template>
    <div class="space-y-4 p-6">
        <h1 class="text-2xl font-bold">概览</h1>
        <p class="text-sm text-muted-foreground">欢迎使用 __APP_TITLE__</p>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-lg border bg-card p-6">
                <p class="text-sm text-muted-foreground">总用户数</p>
                <p class="mt-2 text-3xl font-bold">1,288</p>
            </div>
            <div class="rounded-lg border bg-card p-6">
                <p class="text-sm text-muted-foreground">今日访问</p>
                <p class="mt-2 text-3xl font-bold">268</p>
            </div>
        </div>
    </div>
</template>
