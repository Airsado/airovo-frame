<script lang="ts" setup>
defineOptions({ name: 'BasicLoadingBar' })

const props = withDefaults(
    defineProps<{
        /** 进度值 0-100 */
        progress?: number
    }>(),
    {
        progress: 0,
    },
)

</script>

<template>
    <div
        data-slot="route-progress"
        class="fixed inset-x-0 top-0 z-[100] h-0.5 origin-left bg-primary transition-[width,opacity] duration-200"
        :style="{ width: `${Math.max(props.progress, 5)}%`, opacity: props.progress > 0 ? 1 : 0, boxShadow: '0 0 8px color-mix(in oklch, var(--color-primary) 65%, transparent)' }"
    />
</template>
