import {
    computed,
    getCurrentInstance,
    onBeforeUnmount,
    ref,
    shallowRef,
    type ComputedRef,
    type Ref,
} from 'vue'
import type {
    DataTableFetcher,
    DataTableQuery,
    DataTableResult,
    DataTableRow,
    DataTableSort,
} from './types'

export interface UseDataTableOptions<T extends DataTableRow = DataTableRow> {
    fetcher: DataTableFetcher<T>
    page?: number
    pageSize?: number
    sort?: DataTableSort
    filters?: Record<string, unknown>
    immediate?: boolean
}

export interface UseDataTableReturn<T extends DataTableRow = DataTableRow> {
    rows: Ref<T[]>
    total: Ref<number>
    page: Ref<number>
    pageSize: Ref<number>
    sort: Ref<DataTableSort | undefined>
    filters: Ref<Record<string, unknown>>
    loading: Ref<boolean>
    error: Ref<unknown>
    query: ComputedRef<DataTableQuery>
    hasNextPage: ComputedRef<boolean>
    setPage: (page: number) => Promise<void>
    setPageSize: (pageSize: number) => Promise<void>
    setSort: (sort?: DataTableSort) => Promise<void>
    setFilters: (filters: Record<string, unknown>) => Promise<void>
    reload: () => Promise<void>
    retry: () => Promise<void>
    cancel: () => void
}

function normalizePage(value: number | undefined): number {
    return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : 1
}

function normalizePageSize(value: number | undefined): number {
    return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : 20
}

/** Owns server-side query state without coupling to Axios or an envelope. */
export function useDataTable<T extends DataTableRow = DataTableRow>(
    options: UseDataTableOptions<T>,
): UseDataTableReturn<T> {
    const page = ref(normalizePage(options.page))
    const pageSize = ref(normalizePageSize(options.pageSize))
    const sort = ref<DataTableSort | undefined>(options.sort)
    const filters = ref<Record<string, unknown>>({ ...(options.filters ?? {}) })
    // A shallow ref keeps the caller's row subtype intact. `ref<T[]>` runs
    // Vue's `UnwrapRef` over generic rows, which makes the public `Ref<T[]>`
    // contract fail under vue-tsc for otherwise valid table row types.
    const rows = shallowRef<T[]>([])
    const total = ref(0)
    const loading = ref(false)
    const error = ref<unknown>()
    let controller: AbortController | undefined
    let requestSequence = 0

    const query = computed<DataTableQuery>(() => ({
        page: page.value,
        pageSize: pageSize.value,
        sort: sort.value ? { ...sort.value } : undefined,
        filters: { ...filters.value },
    }))

    const hasNextPage = computed(() => total.value > page.value * pageSize.value)

    function cancel(): void {
        controller?.abort()
        controller = undefined
        loading.value = false
    }

    async function reload(): Promise<void> {
        const sequence = ++requestSequence
        cancel()
        const currentController = new AbortController()
        controller = currentController
        loading.value = true
        error.value = undefined
        const requestQuery: DataTableQuery = {
            page: query.value.page,
            pageSize: query.value.pageSize,
            sort: query.value.sort ? { ...query.value.sort } : undefined,
            filters: query.value.filters ? { ...query.value.filters } : undefined,
        }

        try {
            const result = await options.fetcher(requestQuery, { signal: currentController.signal })
            if (sequence !== requestSequence || currentController.signal.aborted) return
            const normalized: DataTableResult<T> = Array.isArray(result) ? { data: result } : result
            rows.value = normalized.data ?? []
            total.value = typeof normalized.total === 'number' && Number.isFinite(normalized.total)
                ? Math.max(0, normalized.total)
                : rows.value.length
            if (typeof normalized.page === 'number' && normalized.page > 0) page.value = Math.floor(normalized.page)
            if (typeof normalized.pageSize === 'number' && normalized.pageSize > 0) pageSize.value = Math.floor(normalized.pageSize)
        } catch (caught) {
            if (sequence !== requestSequence || currentController.signal.aborted) return
            error.value = caught
            rows.value = []
        } finally {
            if (sequence === requestSequence) {
                loading.value = false
                if (controller === currentController) controller = undefined
            }
        }
    }

    async function setPage(value: number): Promise<void> {
        page.value = normalizePage(value)
        await reload()
    }

    async function setPageSize(value: number): Promise<void> {
        pageSize.value = normalizePageSize(value)
        page.value = 1
        await reload()
    }

    async function setSort(value?: DataTableSort): Promise<void> {
        sort.value = value ? { ...value } : undefined
        page.value = 1
        await reload()
    }

    async function setFilters(value: Record<string, unknown>): Promise<void> {
        filters.value = { ...value }
        page.value = 1
        await reload()
    }

    if (options.immediate !== false) void reload()
    if (getCurrentInstance()) onBeforeUnmount(cancel)

    return {
        rows,
        total,
        page,
        pageSize,
        sort,
        filters,
        loading,
        error,
        query,
        hasNextPage,
        setPage,
        setPageSize,
        setSort,
        setFilters,
        reload,
        retry: reload,
        cancel,
    }
}

