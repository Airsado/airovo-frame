<script setup lang="ts">
/**
 * Descriptions — definition-list style detail view.
 * TODO(v5): column layout, vertical/horizontal, border styles.
 */
defineOptions({ name: 'AirovoDescriptions' })
export interface DescriptionItem {
    label: string
    value: any
    span?: number
}
withDefaults(defineProps<{
    items: DescriptionItem[]
    column?: number
    border?: boolean
}>(), { column: 1, border: false })
</script>
<template>
    <dl
        :class="[
            'grid gap-x-6 gap-y-2 text-sm',
            border ? 'rounded-md border p-4' : '',
            column === 1 ? 'grid-cols-[max-content_1fr]' : `grid-cols-[repeat(${column * 2},max-content_1fr)]`,
        ]"
    >
        <template
            v-for="(it, i) in items"
            :key="i"
        >
            <dt class="text-muted-foreground">{{ it.label }}</dt>
            <dd>{{ it.value }}</dd>
        </template>
    </dl>
</template>
