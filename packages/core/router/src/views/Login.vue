<script setup lang="ts">
defineOptions({ name: 'CoreLogin' })
</script>

<template>
    <div class="flex min-h-svh items-center justify-center bg-background p-4">
        <div class="w-full max-w-sm space-y-6 rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
            <div class="space-y-2 text-center">
                <h1 class="text-2xl font-bold tracking-tight">登录</h1>
                <p class="text-sm text-muted-foreground">框架内置登录页占位</p>
            </div>
            <div class="space-y-4">
                <div class="space-y-2">
                    <label class="text-sm font-medium">账号</label>
                    <input
                        class="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                        placeholder="admin"
                    />
                </div>
                <div class="space-y-2">
                    <label class="text-sm font-medium">密码</label>
                    <input
                        type="password"
                        class="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                        placeholder="••••••"
                    />
                </div>
                <button
                    class="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    登录
                </button>
            </div>
        </div>
    </div>
</template>
