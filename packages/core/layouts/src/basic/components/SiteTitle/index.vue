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
        class="text-foreground inline-flex h-7 items-center gap-1.5 rounded-md px-1.5 text-sm font-medium transition-colors outline-none select-none hover:bg-muted hover:text-foreground focus-visible:ring-ring/40 focus-visible:ring-2"
    >
        <div class="flex size-5 items-center justify-center overflow-hidden rounded-md bg-foreground text-[10px] font-semibold text-background">
            <img v-if="logo" alt="logo" class="size-full rounded-md object-cover" :src="logo" />
            <span v-else aria-hidden="true">A</span>
        </div>
        <span class="max-w-[12rem] truncate text-foreground hidden sm:block">{{ title || 'Framework' }}</span>
    </a>
</template>
