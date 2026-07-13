<script setup lang="ts">
/**
 * Timeline — vertical/horizontal activity feed.
 * TODO(v5): add a connector line + per-item dot color/icon.
 */
defineOptions({ name: 'AirovoTimeline' })
export interface TimelineItem {
    id?: string | number
    title: string
    description?: string
    timestamp?: string
    color?: 'primary' | 'muted' | 'success' | 'warning' | 'destructive'
    icon?: string
}
withDefaults(defineProps<{
    items: TimelineItem[]
    orientation?: 'vertical' | 'horizontal'
}>(), { orientation: 'vertical' })
</script>
<template>
    <ul
        :class="[
            'space-y-3',
            orientation === 'horizontal' ? 'flex gap-6 space-y-0 overflow-x-auto' : '',
        ]"
    >
        <li
            v-for="(it, i) in items"
            :key="it.id ?? i"
            class="flex gap-3"
        >
            <span
                class="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
            />
            <div>
                <p class="text-sm font-medium">{{ it.title }}</p>
                <p v-if="it.description" class="text-xs text-muted-foreground">{{ it.description }}</p>
                <p v-if="it.timestamp" class="mt-0.5 text-[10px] text-muted-foreground/70">{{ it.timestamp }}</p>
            </div>
        </li>
    </ul>
</template>
