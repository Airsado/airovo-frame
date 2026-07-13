<script setup lang="ts">
/**
 * SmoothScrollbar — wheel-only smooth scroll wrapper.
 * TODO(v5): use `smooth-scrollbar` or just CSS `scroll-behavior: smooth`.
 */
defineOptions({ name: 'AirovoSmoothScrollbar' })
withDefaults(defineProps<{
    height?: string | number
    wheelOnly?: boolean
}>(), { wheelOnly: true })
</script>
<template>
    <div
        class="overflow-auto"
        :style="{
            height: typeof height === 'number' ? `${height}px` : (height as string),
            scrollBehavior: 'smooth',
        }"
    >
        <slot />
    </div>
</template>
