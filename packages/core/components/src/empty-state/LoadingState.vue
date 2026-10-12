<script lang="ts" setup>
import { Icon } from '@airovo/shared/icons'

defineOptions({ name: 'LoadingState' })

const props = withDefaults(defineProps<{
    message?: string
    size?: 'sm' | 'md' | 'lg'
    inline?: boolean
    class?: string
}>(), {
    message: '加载中…',
    size: 'md',
    inline: false,
})

const iconSizeClass = {
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-8',
}[props.size]
</script>

<template>
    <span v-if="props.inline" :class="['inline-flex items-center gap-2', props.class]" aria-live="polite" aria-busy="true">
        <Icon icon="lucide:loader-circle" :class="[iconSizeClass, 'animate-spin']" aria-hidden="true" />
        <span v-if="props.message" class="text-sm text-muted-foreground">{{ props.message }}</span>
    </span>
    <div v-else :class="['flex min-h-50 flex-col items-center justify-center gap-3', props.class]" aria-live="polite" aria-busy="true">
        <Icon icon="lucide:loader-circle" :class="[iconSizeClass, 'animate-spin']" aria-hidden="true" />
        <p v-if="props.message" class="text-sm text-muted-foreground">{{ props.message }}</p>
    </div>
</template>
