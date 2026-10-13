<script lang="ts" setup>
import { Icon } from '@airovo/shared/icons'
import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@airovo/uikit-shadcnui'

defineOptions({ name: 'ErrorState' })

const props = withDefaults(defineProps<{
    icon?: string
    title?: string
    description?: string
    retryText?: string
    actionText?: string
    class?: string
}>(), {
    icon: 'lucide:triangle-alert',
    title: '操作失败',
    retryText: '重试',
})

const emit = defineEmits<{
    (event: 'retry', ev: MouseEvent): void
    (event: 'action', ev: MouseEvent): void
}>()
</script>

<template>
    <div role="alert">
        <Empty :class="['min-h-[300px] border-0 px-4 py-8', props.class]">
            <EmptyHeader>
                <EmptyMedia variant="icon"><Icon :icon="props.icon" class="size-6 text-destructive" /></EmptyMedia>
                <EmptyTitle>{{ props.title }}</EmptyTitle>
                <EmptyDescription v-if="props.description">{{ props.description }}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent v-if="$slots.actions || $slots.action || props.retryText || props.actionText">
                <Button v-if="props.retryText" type="button" variant="outline" size="sm" @click="emit('retry', $event)">{{ props.retryText }}</Button>
                <Button v-if="props.actionText" type="button" size="sm" @click="emit('action', $event)">{{ props.actionText }}</Button>
                <slot name="actions" />
                <slot name="action" />
            </EmptyContent>
        </Empty>
    </div>
</template>
