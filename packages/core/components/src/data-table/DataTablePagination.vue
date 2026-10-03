<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'DataTablePagination' })

const props = withDefaults(defineProps<{
    page: number
    pageSize: number
    total: number
    pageSizeOptions?: number[]
}>(), {
    pageSizeOptions: () => [10, 20, 50, 100],
})

const emit = defineEmits<{
    (event: 'update:page', value: number): void
    (event: 'update:pageSize', value: number): void
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(Math.max(0, props.total) / Math.max(props.pageSize, 1))))

function setPage(value: number): void {
    const page = Math.min(Math.max(1, Math.floor(value)), totalPages.value)
    if (page !== props.page) emit('update:page', page)
}

function setPageSize(value: number): void {
    const pageSize = Math.max(1, Math.floor(value))
    if (pageSize !== props.pageSize) emit('update:pageSize', pageSize)
}
</script>

<template>
    <div class="flex flex-wrap items-center justify-between gap-3 border-t px-3 py-3 text-xs text-muted-foreground">
        <span>共 {{ total }} 条，第 {{ page }} / {{ totalPages }} 页</span>
        <div class="flex items-center gap-2">
            <label v-if="pageSizeOptions.length" class="flex items-center gap-1">
                每页
                <select :value="pageSize" class="h-8 rounded-md border bg-background px-2" @change="setPageSize(Number(($event.target as HTMLSelectElement).value))">
                    <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
                </select>
            </label>
            <button type="button" class="rounded-md border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50" :disabled="page <= 1" @click="setPage(page - 1)">上一页</button>
            <button type="button" class="rounded-md border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50" :disabled="page >= totalPages" @click="setPage(page + 1)">下一页</button>
        </div>
    </div>
</template>
