<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineOptions({ name: 'CoreNotFound' })
</script>

<template>
    <div class="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-4 text-center">
        <p class="text-6xl font-bold tracking-tight text-muted-foreground">404</p>
        <h1 class="text-xl font-semibold">页面未找到</h1>
        <p class="text-sm text-muted-foreground">您访问的页面不存在或已被移动。</p>
        <RouterLink
            to="/"
            class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
            返回首页
        </RouterLink>
    </div>
</template>
