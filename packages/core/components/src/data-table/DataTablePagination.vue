<script setup lang="ts">
import { computed } from 'vue'
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@airovo/uikit-shadcnui'

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
const pageItems = computed<Array<number | 'ellipsis'>>(() => {
    if (totalPages.value <= 7) return Array.from({ length: totalPages.value }, (_, index) => index + 1)
    const items: Array<number | 'ellipsis'> = [1]
    if (props.page > 4) items.push('ellipsis')
    for (let value = Math.max(2, props.page - 1); value <= Math.min(totalPages.value - 1, props.page + 1); value++) items.push(value)
    if (props.page < totalPages.value - 3) items.push('ellipsis')
    items.push(totalPages.value)
    return items
})

function setPage(value: number): void {
    const page = Math.min(Math.max(1, Math.floor(value)), totalPages.value)
    if (page !== props.page) emit('update:page', page)
}

function setPageSize(value: number): void {
    const pageSize = Math.max(1, Math.floor(value))
    if (pageSize !== props.pageSize) emit('update:pageSize', pageSize)
}

function handleNavigation(event: MouseEvent, value: number): void {
    if (value < 1 || value > totalPages.value) {
        event.preventDefault()
        return
    }
    event.preventDefault()
    setPage(value)
}
</script>

<template>
    <div class="flex flex-wrap items-center justify-between gap-3 border-t px-3 py-3 text-xs text-muted-foreground">
        <span>共 {{ total }} 条，第 {{ page }} / {{ totalPages }} 页</span>
        <div class="flex flex-wrap items-center gap-3">
            <label v-if="pageSizeOptions.length" class="flex items-center gap-1">
                每页
                <select :value="pageSize" class="h-8 rounded-md border bg-background px-2" @change="setPageSize(Number(($event.target as HTMLSelectElement).value))">
                    <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
                </select>
            </label>
            <Pagination class="mx-0 w-auto">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious href="#previous" text="上一页" :aria-disabled="page <= 1" :tabindex="page <= 1 ? -1 : undefined" @click="handleNavigation($event, page - 1)" />
                    </PaginationItem>
                    <PaginationItem v-for="(item, index) in pageItems" :key="`${item}-${index}`">
                        <PaginationEllipsis v-if="item === 'ellipsis'" />
                        <PaginationLink v-else :href="`#page-${item}`" :is-active="item === page" @click="handleNavigation($event, item)">{{ item }}</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationNext href="#next" text="下一页" :aria-disabled="page >= totalPages" :tabindex="page >= totalPages ? -1 : undefined" @click="handleNavigation($event, page + 1)" />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    </div>
</template>