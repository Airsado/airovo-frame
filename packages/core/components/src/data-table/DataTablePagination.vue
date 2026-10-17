<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@airovo/shared/icons'
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@airovo/uikit-shadcnui'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@airovo/uikit-shadcnui/components/ui/select'

defineOptions({ name: 'DataTablePagination' })

const props = withDefaults(defineProps<{
    page: number
    pageSize: number
    total: number
    pageSizeOptions?: number[]
    compact?: boolean
}>(), {
    pageSizeOptions: () => [10, 20, 50, 100],
    compact: false,
})

const emit = defineEmits<{
    (event: 'update:page', value: number): void
    (event: 'update:pageSize', value: number): void
}>()

const { t, te } = useI18n({ useScope: 'global' })
function copy(key: string, fallback: string): string { return te(key) ? t(key) : fallback }
const totalText = computed(() => copy('common.total', '共'))
const rowsPerPageText = computed(() => copy('common.rowsPerPage', '每页'))
const firstPageText = computed(() => copy('common.firstPage', '首页'))
const previousPageText = computed(() => copy('common.previousPage', '上一页'))
const nextPageText = computed(() => copy('common.nextPage', '下一页'))
const lastPageText = computed(() => copy('common.lastPage', '末页'))
const formattedTotal = computed(() => Math.max(0, props.total).toLocaleString())

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

function handlePageSizeChange(value: unknown): void {
    if (typeof value !== 'string') return
    const pageSize = Number(value)
    if (Number.isFinite(pageSize)) setPageSize(pageSize)
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
    <nav v-if="props.compact" aria-label="pagination" class="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-sm">
        <span class="min-w-0 text-muted-foreground [overflow-wrap:anywhere]">{{ totalText }} {{ formattedTotal }}</span>
        <div class="flex items-center gap-2">
            <PaginationPrevious href="#previous" :text="previousPageText" :aria-disabled="page <= 1" :tabindex="page <= 1 ? -1 : undefined" @click="handleNavigation($event, page - 1)" />
            <span class="tabular-nums" aria-live="polite">{{ page }} / {{ totalPages }}</span>
            <PaginationNext href="#next" :text="nextPageText" :aria-disabled="page >= totalPages" :tabindex="page >= totalPages ? -1 : undefined" @click="handleNavigation($event, page + 1)" />
        </div>
    </nav>
    <div v-else class="flex min-w-0 items-center justify-end gap-3 border-t px-3 py-3 text-xs text-muted-foreground">
        <div class="flex min-w-0 shrink-0 items-baseline gap-1.5 whitespace-nowrap">
            <span class="text-muted-foreground/80">{{ totalText }}</span>
            <span class="text-foreground tabular-nums">{{ formattedTotal }}</span>
        </div>
        <div class="flex shrink-0 items-center gap-1.5">
            <span class="hidden text-sm font-medium whitespace-nowrap sm:inline">{{ rowsPerPageText }}</span>
            <Select :model-value="String(pageSize)" @update:model-value="handlePageSizeChange">
                <SelectTrigger class="text-foreground h-8 w-[64px] font-medium tabular-nums sm:w-[70px]">
                    <SelectValue :placeholder="String(pageSize)" />
                </SelectTrigger>
                <SelectContent side="top" align-item-with-trigger="false">
                    <SelectGroup>
                        <SelectItem v-for="size in pageSizeOptions" :key="size" :value="String(size)">{{ size }}</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
        <Pagination class="mx-0 w-auto">
            <PaginationContent>
                <PaginationItem>
                    <PaginationLink href="#first" :aria-label="firstPageText" :aria-disabled="page <= 1" :tabindex="page <= 1 ? -1 : undefined" class="hidden size-8 p-0 sm:inline-flex" @click="handleNavigation($event, 1)"><Icon icon="lucide:chevrons-left" class="size-4" /></PaginationLink>
                </PaginationItem>
                <PaginationItem>
                    <PaginationPrevious href="#previous" :text="previousPageText" :aria-disabled="page <= 1" :tabindex="page <= 1 ? -1 : undefined" @click="handleNavigation($event, page - 1)" />
                </PaginationItem>
                <PaginationItem v-for="(item, index) in pageItems" :key="`${item}-${index}`">
                    <PaginationEllipsis v-if="item === 'ellipsis'" />
                    <PaginationLink v-else :href="`#page-${item}`" :is-active="item === page" @click="handleNavigation($event, item)">{{ item }}</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                    <PaginationNext href="#next" :text="nextPageText" :aria-disabled="page >= totalPages" :tabindex="page >= totalPages ? -1 : undefined" @click="handleNavigation($event, page + 1)" />
                </PaginationItem>
                <PaginationItem>
                    <PaginationLink href="#last" :aria-label="lastPageText" :aria-disabled="page >= totalPages" :tabindex="page >= totalPages ? -1 : undefined" class="hidden size-8 p-0 sm:inline-flex" @click="handleNavigation($event, totalPages)"><Icon icon="lucide:chevrons-right" class="size-4" /></PaginationLink>
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    </div>
</template>
