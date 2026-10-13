<script lang="ts" setup>
import { computed } from 'vue'
import { Spinner } from '@airovo/uikit-shadcnui'

defineOptions({ name: 'LoadingState' })

const props = withDefaults(defineProps<{
    message?: string
    size?: 'sm' | 'md' | 'lg'
    inline?: boolean
    ariaLabel?: string
    class?: string
}>(), {
    message: '加载中…',
    size: 'md',
    inline: false,
})

const resolvedLabel = computed(() => props.ariaLabel ?? props.message)
const iconSizeClass = { sm: 'size-4', md: 'size-6', lg: 'size-8' }[props.size]
</script>

<template>
    <span v-if="props.inline" :class="['inline-flex items-center gap-2', props.class]" role="status" :aria-label="resolvedLabel" aria-live="polite" aria-busy="true">
        <Spinner :class="iconSizeClass" aria-hidden="true" />
        <span v-if="props.message" class="text-sm text-muted-foreground">{{ props.message }}</span>
    </span>
    <div v-else :class="['flex min-h-[200px] flex-col items-center justify-center gap-3', props.class]" role="status" :aria-label="resolvedLabel" aria-live="polite" aria-busy="true">
        <Spinner :class="iconSizeClass" aria-hidden="true" />
        <p v-if="props.message" class="text-sm text-muted-foreground">{{ props.message }}</p>
    </div>
</template>
