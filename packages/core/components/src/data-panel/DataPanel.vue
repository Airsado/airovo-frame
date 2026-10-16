<script lang="ts" setup>
import EmptyState from '../empty-state/EmptyState.vue'
import ErrorState from '../empty-state/ErrorState.vue'
import LoadingState from '../empty-state/LoadingState.vue'

defineOptions({ name: 'DataPanel' })

const props = withDefaults(defineProps<{
    loading?: boolean
    error?: unknown
    errorText?: string
    retryText?: string | null
    showRetry?: boolean
    empty?: boolean
    emptyTitle?: string
    emptyDescription?: string
    emptyIcon?: string
    fixedHeight?: boolean
    class?: string
}>(), {
    loading: false,
    showRetry: false,
    empty: false,
    emptyIcon: 'lucide:database',
    fixedHeight: false,
})

const emit = defineEmits<{
    (event: 'retry'): void
}>()

function retry(): void {
    emit('retry')
}
</script>

<template>
    <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card" :class="[$props.class, props.fixedHeight && 'h-full']" :aria-busy="props.loading ? 'true' : undefined">
        <div v-if="$slots.toolbar" class="shrink-0 border-b px-3 py-2.5 sm:px-4"><slot name="toolbar" /></div>
        <div class="min-h-0 flex-1" :class="props.fixedHeight && 'overflow-auto'">
            <div v-if="props.loading" data-slot="data-panel-loading">
                <slot name="loading"><LoadingState /></slot>
            </div>
            <div v-else-if="props.error !== undefined && props.error !== null && props.error !== false" data-slot="data-panel-error">
                <slot name="error" :error="props.error" :retry="retry">
                    <ErrorState
                        :description="props.errorText"
                        :retry-text="props.retryText"
                        :show-retry="props.showRetry"
                        @retry="retry"
                    />
                </slot>
            </div>
            <slot v-else-if="!props.empty" />
            <div v-else data-slot="data-panel-empty">
                <slot name="empty">
                    <EmptyState
                        :icon="props.emptyIcon"
                        :title="props.emptyTitle"
                        :description="props.emptyDescription"
                    />
                </slot>
            </div>
        </div>
        <div v-if="$slots.footer" class="shrink-0 border-t px-3 py-2.5 sm:px-4"><slot name="footer" /></div>
    </section>
</template>
