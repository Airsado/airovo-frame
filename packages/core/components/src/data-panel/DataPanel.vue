<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { Icon } from '@airovo/shared/icons'
import { Skeleton } from '@airovo/uikit-shadcnui'

defineOptions({ name: 'DataPanel' })

const { t } = useI18n({ useScope: 'global' })

withDefaults(defineProps<{
    loading?: boolean
    empty?: boolean
    emptyTitle?: string
    emptyDescription?: string
    emptyIcon?: string
    fixedHeight?: boolean
    class?: string
}>(), {
    loading: false,
    empty: false,
    emptyIcon: 'lucide:database',
    fixedHeight: false,
})
</script>

<template>
    <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card" :class="[$props.class, fixedHeight && 'h-full']">
        <div v-if="$slots.toolbar" class="shrink-0 border-b px-3 py-2.5 sm:px-4"><slot name="toolbar" /></div>
        <div class="min-h-0 flex-1" :class="fixedHeight && 'overflow-auto'">
            <div v-if="loading" class="space-y-3 p-4"><Skeleton v-for="index in 5" :key="index" class="h-10 w-full" /></div>
            <slot v-else-if="!empty" />
            <slot v-else name="empty">
                <div class="flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <div class="flex size-12 items-center justify-center rounded-full bg-muted"><Icon :icon="emptyIcon" class="size-6 text-muted-foreground" /></div>
                    <div class="space-y-1"><h3 class="text-base font-semibold">{{ emptyTitle ?? t('common.noData') }}</h3><p class="max-w-md text-sm text-muted-foreground">{{ emptyDescription ?? t('common.noDataDescription') }}</p></div>
                </div>
            </slot>
        </div>
        <div v-if="$slots.footer" class="shrink-0 border-t px-3 py-2.5 sm:px-4"><slot name="footer" /></div>
    </section>
</template>
