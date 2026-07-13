<script setup lang="ts">
/**
 * Watermark — full-page diagonal text watermark (anti-screenshot).
 * TODO(v5): overlay an absolute-positioned repeating SVG/canvas.
 */
defineOptions({ name: 'AirovoWatermark' })
withDefaults(defineProps<{
    text: string
    fontSize?: number
    color?: string
    rotate?: number
    opacity?: number
}>(), { fontSize: 16, color: '#000', rotate: -22, opacity: 0.08 })
</script>
<template>
    <div class="pointer-events-none fixed inset-0 flex items-center justify-center select-none">
        <span
            class="text-foreground"
            :style="{
                fontSize: `${fontSize}px`,
                color,
                opacity,
                transform: `rotate(${rotate}deg)`,
            }"
        >Watermark-stub · {{ text }}</span>
    </div>
</template>
