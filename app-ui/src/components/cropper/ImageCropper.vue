<script setup lang="ts">
/**
 * ImageCropper — image cropper with zoom/rotate/aspect-ratio.
 * TODO(v5): use `cropperjs` (or `vue-cropperjs`).
 */
defineOptions({ name: 'AirovoImageCropper' })
defineProps<{
    src: string
    aspectRatio?: number
    outputSize?: { width: number; height: number }
}>()
const emit = defineEmits<{ 'crop': [blob: Blob] }>()
</script>
<template>
    <div class="flex h-64 items-center justify-center rounded-md border border-dashed border-input bg-card text-sm text-muted-foreground">
        ImageCropper-stub
    </div>
</template>
