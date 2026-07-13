<script setup lang="ts">
/**
 * ExcelImport — upload an .xlsx/.csv file and emit parsed rows.
 * TODO(v5): wire SheetJS (xlsx) to read the file and emit `parsed`.
 */
defineOptions({ name: 'AirovoExcelImport' })
defineProps<{
    fileType?: 'xlsx' | 'csv'
    /** Optional sheet name for xlsx files. */
    sheet?: string
}>()
const emit = defineEmits<{ parsed: [rows: Record<string, any>[]]; error: [error: Error] }>()
</script>
<template>
    <label class="inline-flex items-center gap-2 rounded-md border border-dashed border-input bg-card px-4 py-2 text-sm cursor-pointer hover:bg-accent">
        <input
            type="file"
            class="sr-only"
            :accept="fileType === 'csv' ? '.csv' : '.xlsx,.xls'"
            @change="emit('parsed', [])"
        >
        <span>ExcelImport-stub ({{ fileType ?? 'xlsx' }})</span>
    </label>
</template>
