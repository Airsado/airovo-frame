<script setup lang="ts">
/**
 * Barcode — render a CODE128 / EAN barcode from a string.
 * TODO(v5): use `jsbarcode` (or `vue-barcode`).
 */
defineOptions({ name: 'AirovoBarcode' })
withDefaults(defineProps<{
    value: string
    format?: 'CODE128' | 'EAN13' | 'EAN8' | 'UPC'
    width?: number
    height?: number
}>(), { format: 'CODE128', width: 2, height: 60 })
</script>
<template>
    <div
        class="inline-flex items-center justify-center border-2 border-dashed border-border bg-card text-xs text-muted-foreground"
        :style="{ height: `${height + 16}px`, minWidth: '120px', padding: '0 8px' }"
    >Barcode-stub · {{ format }}</div>
</template>
