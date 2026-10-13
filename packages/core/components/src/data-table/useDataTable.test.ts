// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useDataTable } from './useDataTable'

interface Row extends Record<string, unknown> {
    id: number
    name: string
}

describe('useDataTable', () => {
    it('loads server results and resets page for filters and sorting', async () => {
        const fetcher = vi.fn(async (query) => ({
            data: [{ id: query.page, name: String(query.filters?.search ?? 'all') } satisfies Row],
            total: 21,
        }))
        const scope = effectScope()
        const api = scope.run(() => useDataTable<Row>({
            fetcher,
            immediate: false,
            page: 2,
            pageSize: 10,
        }))!

        await api.reload()
        expect(fetcher).toHaveBeenLastCalledWith(
            { page: 2, pageSize: 10, sort: undefined, filters: {} },
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
        )
        expect(api.rows.value[0]?.id).toBe(2)
        expect(api.hasNextPage.value).toBe(true)

        await api.setFilters({ search: 'new' })
        expect(fetcher).toHaveBeenLastCalledWith(
            { page: 1, pageSize: 10, sort: undefined, filters: { search: 'new' } },
            expect.anything(),
        )
        await api.setSort({ key: 'name', direction: 'desc' })
        expect(fetcher).toHaveBeenLastCalledWith(
            { page: 1, pageSize: 10, sort: { key: 'name', direction: 'desc' }, filters: { search: 'new' } },
            expect.anything(),
        )
        scope.stop()
    })

    it('ignores a late response from an older request', async () => {
        const deferred: Array<(result: { data: Row[]; total: number }) => void> = []
        const signals: AbortSignal[] = []
        const fetcher = vi.fn((_query, context: { signal: AbortSignal }) => new Promise<{ data: Row[]; total: number }>((resolve) => {
            signals.push(context.signal)
            deferred.push(resolve)
        }))
        const scope = effectScope()
        const api = scope.run(() => useDataTable<Row>({ fetcher, immediate: false }))!

        const oldRequest = api.reload()
        const newRequest = api.setFilters({ search: 'latest' })
        expect(signals[0]?.aborted).toBe(true)
        deferred[1]?.({ data: [{ id: 2, name: 'new' }], total: 1 })
        await newRequest
        deferred[0]?.({ data: [{ id: 1, name: 'old' }], total: 1 })
        await oldRequest

        expect(api.rows.value).toEqual([{ id: 2, name: 'new' }])
        expect(api.filters.value).toEqual({ search: 'latest' })
        scope.stop()
    })

    it('exposes errors and retry reloads the same query', async () => {
        const failure = new Error('network')
        let attempt = 0
        const fetcher = vi.fn(async () => {
            attempt += 1
            if (attempt === 1) throw failure
            return { data: [{ id: 1, name: 'ok' } satisfies Row], total: 1 }
        })
        const scope = effectScope()
        const api = scope.run(() => useDataTable<Row>({ fetcher, immediate: false }))!

        await api.reload()
        expect(api.error.value).toBe(failure)
        await api.retry()
        expect(api.error.value).toBeUndefined()
        expect(api.rows.value).toEqual([{ id: 1, name: 'ok' }])
        scope.stop()
    })

    it('restores valid query state and writes changes through an injected sync adapter', async () => {
        const writes: unknown[] = []
        const scope = effectScope()
        const api = scope.run(() => useDataTable<Row>({
            fetcher: vi.fn(async () => ({ data: [], total: 0 })),
            immediate: false,
            page: 4,
            pageSize: 30,
            sort: { key: 'fallback', direction: 'asc' },
            filters: { base: true },
            querySync: {
                read: () => ({
                    page: 2,
                    pageSize: 50,
                    sort: { key: 'name', direction: 'desc' },
                    filters: { status: 'ready' },
                }),
                write: (query) => writes.push(query),
            },
        }))!

        expect(api.page.value).toBe(2)
        expect(api.pageSize.value).toBe(50)
        expect(api.sort.value).toEqual({ key: 'name', direction: 'desc' })
        expect(api.filters.value).toEqual({ base: true, status: 'ready' })

        await api.setPage(3)
        expect(writes.at(-1)).toEqual({ page: 3, pageSize: 50, sort: { key: 'name', direction: 'desc' }, filters: { base: true, status: 'ready' } })
        scope.stop()
    })

    it('falls back to option defaults for invalid synced values', () => {
        const scope = effectScope()
        const api = scope.run(() => useDataTable<Row>({
            fetcher: vi.fn(async () => []),
            immediate: false,
            page: 4,
            pageSize: 30,
            sort: { key: 'fallback', direction: 'asc' },
            querySync: { read: () => ({ page: 0, pageSize: -1, sort: { key: '', direction: 'bad' } as never }) },
        }))!
        expect(api.page.value).toBe(4)
        expect(api.pageSize.value).toBe(30)
        expect(api.sort.value).toEqual({ key: 'fallback', direction: 'asc' })
        scope.stop()
    })

    it('applies external query changes through subscribe without writing them back', async () => {
        let notify: (() => void) | undefined
        const cleanup = vi.fn()
        const writes: unknown[] = []
        let state: { page?: number; pageSize?: number; filters?: Record<string, unknown> } = { page: 1, pageSize: 20 }
        const fetcher = vi.fn(async () => ({ data: [], total: 0 }))
        const scope = effectScope()
        const api = scope.run(() => useDataTable<Row>({
            fetcher,
            immediate: false,
            querySync: {
                read: () => state,
                write: (query) => writes.push(query),
                subscribe: (listener) => { notify = listener; return cleanup },
            },
        }))!

        state = { page: 3, pageSize: 50, filters: { status: 'ready' } }
        notify?.()
        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(api.page.value).toBe(3)
        expect(api.pageSize.value).toBe(50)
        expect(api.filters.value).toEqual({ status: 'ready' })
        expect(fetcher).toHaveBeenCalledWith({ page: 3, pageSize: 50, sort: undefined, filters: { status: 'ready' } }, expect.anything())
        expect(writes).toHaveLength(0)
        scope.stop()
        expect(cleanup).toHaveBeenCalledOnce()
    })
})
