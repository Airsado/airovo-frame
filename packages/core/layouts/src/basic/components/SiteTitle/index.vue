<script lang="ts" setup>

defineOptions({ name: 'BasicSiteTitle' });

const props = defineProps<{
    title?: string
    logo?: string
}>()
</script>


<template>
    <a aria-label="返回主页" href="/"
        class="h-[--app-header-height] text-foreground inline-flex h-7 items-center gap-1.5 rounded-md px-1.5 text-sm font-medium transition-colors outline-none select-none hover:bg-accent focus-visible:ring-ring/40 focus-visible:ring-2">
        <div class="flex size-5 items-center justify-center overflow-hidden rounded-md">
            <img alt="徽标" class="size-full rounded-md object-cover"
                :src="logo || 'https://www.airsado.cn/usr/uploads/avatar_24.jpg'" />
        </div>
        <span class="max-w-[12rem] truncate">{{ title || '后台' }}</span>
    </a>
</template>