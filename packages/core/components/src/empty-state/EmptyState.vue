<script lang="ts" setup>
import { Icon } from '@airovo/shared/icons'
import { Button } from '@airovo/uikit-shadcnui'

const props = withDefaults(
    defineProps<{
        icon?: string
        title?: string
        description?: string
        actionText?: string
        bordered?: boolean
        size?: 'sm' | 'md' | 'lg'
        class?: string
    }>(),
    {
        size: 'md',
        bordered: false,
    },
)

defineEmits<{
    (e: 'action', ev: MouseEvent): void
}>()

const iconSizeClass = {
    sm: 'size-8',
    md: 'size-12',
    lg: 'size-16',
}[props.size]
</script>

<template>
    <div
        :class="[
            'flex min-h-48 flex-col items-center justify-center gap-3 px-4 py-8 text-center md:py-10',
            props.bordered && 'border',
            props.class,
        ]"
    >
        <div
            v-if="icon"
            :class="[
                'flex items-center justify-center rounded-xl bg-muted/60 text-muted-foreground ring-1 ring-foreground/10',
                iconSizeClass,
            ]"
        >
            <Icon :icon="icon" class="size-1/2" />
        </div>
        <div class="space-y-1">
            <h3 v-if="title" class="text-base font-semibold">{{ title }}</h3>
            <p
                v-if="description"
                class="max-w-md text-sm leading-relaxed text-muted-foreground"
            >
                {{ description }}
            </p>
        </div>
        <div v-if="$slots.actions || $slots.action" class="flex flex-wrap items-center justify-center gap-2">
            <slot name="actions" />
            <slot name="action" />
        </div>
        <Button v-if="actionText" @click="$emit('action', $event)">
            {{ actionText }}
        </Button>
    </div>
</template>
