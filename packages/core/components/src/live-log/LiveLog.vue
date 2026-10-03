<script setup lang="ts">
import { useFollowTail } from './useFollowTail'

defineOptions({ name: 'LiveLog' })

const props = withDefaults(defineProps<{
    items: readonly unknown[]
    emptyText?: string
    maxHeight?: string
}>(), {
    emptyText: '暂无日志',
    maxHeight: '16rem',
})

const followTail = useFollowTail({ items: () => props.items })

function setContainer(element: unknown): void {
    followTail.container.value = element as HTMLElement | null
}
</script>

<template>
    <div class="relative min-h-0">
        <div
            :ref="setContainer"
            class="hover-scrollbar min-h-0 overflow-y-auto overscroll-contain p-4 font-mono text-xs"
            :style="{ maxHeight: props.maxHeight }"
            @scroll="followTail.onScroll"
        >
            <p v-if="props.items.length === 0" class="text-muted-foreground">{{ props.emptyText }}</p>
            <template v-else>
                <slot v-for="(item, index) in props.items" :item="item" :index="index">
                    <p class="rounded border px-2 py-1">{{ JSON.stringify(item) }}</p>
                </slot>
            </template>
        </div>
        <button
            v-if="!followTail.following"
            type="button"
            class="absolute bottom-3 right-3 rounded-full border bg-background/95 px-3 py-1.5 text-xs shadow-sm transition-colors hover:bg-accent"
            @click="followTail.resumeFollowing"
        >
            跟随最新
        </button>
    </div>
</template>
