<script lang="ts" setup>
import { provide, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { pageFooterTargetKey } from './page-footer-context'

defineOptions({ name: 'SectionPage' })

const { t } = useI18n({ useScope: 'global' })
const footerTarget = ref<HTMLElement | null>(null)
provide(pageFooterTargetKey, footerTarget)

withDefaults(defineProps<{
    fixedContent?: boolean
    stackActionsOnMobile?: boolean
    class?: string
}>(), {
    fixedContent: false,
    stackActionsOnMobile: false,
})
</script>

<template>
    <section class="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background text-foreground" :class="$props.class">
        <header
            data-slot="section-page-header"
            class="shrink-0 bg-background px-3 pb-2.5 pt-3 sm:px-4 sm:pb-3 sm:pt-5"
        >
            <div v-if="$slots.breadcrumb" class="mb-2 sm:mb-3">
                <slot name="breadcrumb" />
            </div>
            <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:gap-x-4" :class="stackActionsOnMobile && 'max-sm:items-start'">
                <div class="min-w-0 flex-1" :class="stackActionsOnMobile && 'max-sm:basis-full'">
                    <h2 class="truncate text-base font-bold tracking-tight sm:text-lg">
                        <slot name="title">{{ t('common.untitledPage') }}</slot>
                    </h2>
                    <p v-if="$slots.description" class="mt-1 text-xs text-muted-foreground sm:text-sm">
                        <slot name="description" />
                    </p>
                </div>
                <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-x-4">
                    <slot name="actions" />
                </div>
            </div>
        </header>

        <div class="min-h-0 flex-1 px-3 pb-3 pt-1 sm:px-4 sm:pb-4 sm:pt-1.5" :class="fixedContent ? 'overflow-hidden' : 'overflow-auto'">
            <div v-if="$slots.tabs" data-slot="section-page-tabs" class="mb-3 min-w-0 sm:mb-4">
                <slot name="tabs" />
            </div>
            <slot />
        </div>

        <footer v-if="$slots.footer" class="shrink-0 border-t bg-background px-3 py-2.5 sm:px-4 sm:py-3">
            <slot name="footer" />
        </footer>
        <div ref="footerTarget" data-slot="section-page-footer-host" class="bg-background shrink-0 border-t px-3 py-2.5 empty:hidden sm:px-4 sm:py-3" />
    </section>
</template>
