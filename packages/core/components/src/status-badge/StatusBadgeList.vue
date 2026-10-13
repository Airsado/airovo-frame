<script setup lang="ts">
import { computed, type PropType } from 'vue'
import StatusBadge from './StatusBadge.vue'

defineOptions({ name: 'StatusBadgeList' })

const props = defineProps({
    items: { type: Array as PropType<readonly unknown[]>, default: () => [] },
    max: { type: Number, default: 2 },
    getKey: { type: Function as PropType<(item: unknown, index: number) => string | number>, default: undefined },
    moreLabel: { type: Function as PropType<(remaining: number) => string>, default: undefined },
    class: { type: String, default: undefined },
})

const displayed = computed(() => props.items.slice(0, Math.max(0, props.max)))
const remaining = computed(() => Math.max(0, props.items.length - displayed.value.length))
</script>

<template>
    <div data-slot="status-badge-list" :class="['flex max-w-full min-w-0 items-center gap-1 overflow-hidden', props.class]">
        <template v-if="props.items.length">
            <template v-for="(item, index) in displayed" :key="props.getKey?.(item, index) ?? index">
                <slot name="item" :item="item" :index="index">{{ String(item) }}</slot>
            </template>
            <StatusBadge v-if="remaining" variant="neutral" size="sm" :copyable="false" class="shrink-0">
                {{ props.moreLabel?.(remaining) ?? `+${remaining}` }}
            </StatusBadge>
        </template>
        <slot v-else name="empty"><span class="text-muted-foreground text-xs">-</span></slot>
    </div>
</template>
