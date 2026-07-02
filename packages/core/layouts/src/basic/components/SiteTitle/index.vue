<script lang="ts" setup>
defineOptions({ name: 'BasicSiteTitle' })

defineProps<{
    title?: string
    logo?: string
}>()
</script>

<template>
    <a
        aria-label="返回主页"
        href="/"
        class="text-foreground inline-flex h-7 items-center gap-1.5 rounded-md px-1.5 text-sm font-medium transition-colors outline-none select-none hover:bg-accent focus-visible:ring-ring/40 focus-visible:ring-2"
    >
        <div class="flex size-5 items-center justify-center overflow-hidden rounded-md">
            <img
                alt="logo"
                class="size-full rounded-md object-cover"
                :src="logo || 'https://www.airsado.cn/usr/uploads/avatar_24.jpg'"
            />
        </div>
        <span class="max-w-[12rem] truncate text-foreground hidden sm:block">{{ title || 'AirOvO' }}</span>
    </a>
</template>
