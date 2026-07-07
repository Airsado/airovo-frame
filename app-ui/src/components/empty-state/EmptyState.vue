<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { Button } from '@airovo/uikit-shadcnui'

const props = withDefaults(defineProps<{
    icon?: string
    title?: string
    description?: string
    actionText?: string
    size?: 'sm' | 'md' | 'lg'
    class?: string
}>(), {
    size: 'md',
})

defineEmits<{
    (e: 'action', ev: MouseEvent): void
}>()

const iconSizeClass = {
    sm: 'size-12',
    md: 'size-20',
    lg: 'size-32',
}[props.size]
</script>

<template>
    <div
        :class="[
            'flex flex-col items-center justify-center gap-3 p-6 text-center md:gap-4 md:p-10',
            props.class,
        ]"
    >
        <div v-if="icon" :class="['flex items-center justify-center rounded-full bg-muted', iconSizeClass]">
            <Icon :icon="icon" class="size-1/2 text-muted-foreground" />
        </div>
        <div class="space-y-1">
            <h3 v-if="title" class="text-base font-semibold">{{ title }}</h3>
            <p v-if="description" class="max-w-md text-sm text-muted-foreground">
                {{ description }}
            </p>
        </div>
        <slot name="actions" />
        <Button v-if="actionText" @click="$emit('action', $event)">
            {{ actionText }}
        </Button>
    </div>
</template>
