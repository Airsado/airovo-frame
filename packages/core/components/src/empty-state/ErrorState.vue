<script lang="ts" setup>
import { Icon } from '@airovo/shared/icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@airovo/uikit-shadcnui'

defineOptions({ name: 'ErrorState' })

const props = withDefaults(defineProps<{
    icon?: string
    title?: string
    description?: string
    retryText?: string | null
    showRetry?: boolean
    actionText?: string
    class?: string
}>(), { icon: 'lucide:triangle-alert', showRetry: false })

const emit = defineEmits<{
    (event: 'retry', ev: MouseEvent): void
    (event: 'action', ev: MouseEvent): void
}>()
const { t, te } = useI18n({ useScope: 'global' })
const resolvedTitle = computed(() => props.title ?? (te('common.error') ? t('common.error') : '操作失败'))
const resolvedRetryText = computed(() => props.retryText ?? (te('common.retry') ? t('common.retry') : '重试'))
const canRetry = computed(() => props.showRetry || props.retryText != null)
</script>

<template>
    <div role="alert">
        <Empty :class="['min-h-[300px] border-0 px-4 py-8 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200', props.class]">
            <EmptyHeader>
                <EmptyMedia variant="icon"><Icon :icon="props.icon" class="size-6 text-destructive" /></EmptyMedia>
                <EmptyTitle>{{ resolvedTitle }}</EmptyTitle>
                <EmptyDescription v-if="props.description">{{ props.description }}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent v-if="$slots.actions || $slots.action || canRetry || props.actionText">
                <Button v-if="canRetry && resolvedRetryText" type="button" variant="outline" size="sm" @click="emit('retry', $event)">{{ resolvedRetryText }}</Button>
                <Button v-if="props.actionText" type="button" size="sm" @click="emit('action', $event)">{{ props.actionText }}</Button>
                <slot name="actions" />
                <slot name="action" />
            </EmptyContent>
        </Empty>
    </div>
</template>
