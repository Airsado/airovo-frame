<script lang="ts" setup>
import { Icon } from '@airovo/shared/icons'
import { Button } from '@airovo/uikit-shadcnui'

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
    <div :class="['flex min-h-56 flex-col items-center justify-center gap-3 px-4 py-8 text-center', props.class]" role="alert">
        <div class="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
            <Icon :icon="props.icon" class="size-6" />
        </div>
        <div class="flex flex-col gap-1">
            <h3 class="text-base font-semibold">{{ props.title }}</h3>
            <p v-if="props.description" class="max-w-md text-sm leading-relaxed text-muted-foreground">{{ props.description }}</p>
        </div>
        <div v-if="$slots.actions || $slots.action || props.retryText || props.actionText" class="flex flex-wrap items-center justify-center gap-2">
            <Button v-if="props.retryText" type="button" variant="outline" size="sm" @click="emit('retry', $event)">{{ props.retryText }}</Button>
            <Button v-if="props.actionText" type="button" size="sm" @click="emit('action', $event)">{{ props.actionText }}</Button>
            <slot name="actions" />
            <slot name="action" />
        </div>
    </div>
</template>
