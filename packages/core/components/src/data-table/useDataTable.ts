import {
    computed,
    getCurrentInstance,
    onBeforeUnmount,
    ref,
    shallowRef,
    watch,
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
    /** Optional application-owned URL/query state bridge. */
    querySync?: DataTableQuerySync
    immediate?: boolean
}

export type DataTableQueryState = Partial<Pick<DataTableQuery, 'page' | 'pageSize' | 'sort'>> & {
    filters?: Record<string, unknown>
}

export interface DataTableQuerySync {
    read?: () => DataTableQueryState | undefined
    write?: (query: DataTableQuery) => void
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

function normalizePage(value: number | undefined, fallback = 1): number {
    return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : fallback
}

function normalizePageSize(value: number | undefined, fallback = 20): number {
    return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : fallback
}

function normalizeSort(value: unknown): DataTableSort | undefined {
    if (!value || typeof value !== 'object') return undefined
    const candidate = value as Partial<DataTableSort>
    if (typeof candidate.key !== 'string' || !candidate.key || (candidate.direction !== 'asc' && candidate.direction !== 'desc')) return undefined
    return { key: candidate.key, direction: candidate.direction }
}

function readQueryState(sync: DataTableQuerySync | undefined): DataTableQueryState {
    if (!sync?.read) return {}
    try {
        const state = sync.read()
        return state && typeof state === 'object' ? state : {}
    } catch {
        return {}
    }
}

/** Owns server-side query state without coupling to Axios or an envelope. */
export function useDataTable<T extends DataTableRow = DataTableRow>(
    options: UseDataTableOptions<T>,
): UseDataTableReturn<T> {
    const synced = readQueryState(options.querySync)
    const page = ref(normalizePage(synced.page, normalizePage(options.page)))
    const pageSize = ref(normalizePageSize(synced.pageSize, normalizePageSize(options.pageSize)))
    const sort = ref<DataTableSort | undefined>(normalizeSort(synced.sort) ?? options.sort)
    const filters = ref<Record<string, unknown>>({ ...(options.filters ?? {}), ...(synced.filters ?? {}) })
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

    if (options.querySync?.write) {
        watch(query, (value) => {
            try {
                options.querySync?.write?.({
                    page: value.page,
                    pageSize: value.pageSize,
                    sort: value.sort ? { ...value.sort } : undefined,
                    filters: value.filters ? { ...value.filters } : undefined,
                })
            } catch {
                // A URL/history adapter must not break table state when storage is unavailable.
            }
        }, { deep: true })
    }

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

