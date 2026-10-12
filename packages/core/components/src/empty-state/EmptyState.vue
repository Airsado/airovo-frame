<script lang="ts" setup>
import { computed } from 'vue'
import { Icon } from '@airovo/shared/icons'
import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@airovo/uikit-shadcnui'

const props = withDefaults(defineProps<{
    icon?: string
    title?: string
    description?: string
    actionText?: string
    bordered?: boolean
    size?: 'sm' | 'md' | 'lg'
    class?: string
}>(), { size: 'md', bordered: false })

const emit = defineEmits<{ (event: 'action', ev: MouseEvent): void }>()
const mediaSize = computed(() => ({ sm: 'size-8', md: 'size-12', lg: 'size-16' })[props.size])
</script>

<template>
    <Empty :class="[props.bordered ? 'border' : 'border-0', 'min-h-48 px-4 py-8 md:py-10', props.class]">
        <EmptyHeader>
            <EmptyMedia v-if="props.icon" variant="icon" :class="mediaSize"><Icon :icon="props.icon" class="size-1/2" /></EmptyMedia>
            <EmptyTitle v-if="props.title">{{ props.title }}</EmptyTitle>
            <EmptyDescription v-if="props.description">{{ props.description }}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent v-if="$slots.actions || $slots.action || props.actionText">
            <slot name="actions" />
            <slot name="action" />
            <Button v-if="props.actionText" type="button" @click="emit('action', $event)">{{ props.actionText }}</Button>
        </EmptyContent>
    </Empty>
</template>
