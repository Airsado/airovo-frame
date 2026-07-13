<script setup lang="ts">
/**
 * QrCode — render a QR code from a string value.
 * TODO(v5): use `qrcode` to render to a <canvas>.
 */
defineOptions({ name: 'AirovoQrCode' })
withDefaults(defineProps<{
    value: string
    size?: number
    level?: 'L' | 'M' | 'Q' | 'H'
    bgColor?: string
    fgColor?: string
    margin?: number
}>(), { size: 160, level: 'M', bgColor: '#fff', fgColor: '#000', margin: 1 })
</script>
<template>
    <div
        class="inline-flex items-center justify-center border-2 border-dashed border-border bg-card text-xs text-muted-foreground"
        :style="{ width: `${size}px`, height: `${size}px` }"
    >QR-stub</div>
</template>
