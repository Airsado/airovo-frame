// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import DataTable from './DataTable.vue'

const columns = [
    { key: 'name', title: '名称', sortable: true },
    { key: 'kind', title: '类型', hidden: true },
]

const rows = [
    { id: 1, name: 'one', kind: 'a' },
    { id: 2, name: 'two', kind: 'b' },
]

function mountTable(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
    return mount(DataTable, {
        props: { columns, data: rows, ...props },
        slots,
        global: {
            plugins: [createI18n({
                legacy: false,
                locale: 'zh-CN',
                messages: { 'zh-CN': { common: { noData: '暂无数据' } } },
            })],
        },
    })
}

describe('DataTable', () => {
    it('matches the new-api bordered table surface and keeps the toolbar outside it', () => {
        const wrapper = mountTable({ pagination: true, total: rows.length }, {
            toolbar: '<span data-toolbar>表格工具栏</span>',
        })
        const surface = wrapper.get('[data-slot="data-table-surface"]')

        expect(surface.classes()).toEqual(expect.arrayContaining(['overflow-hidden', 'rounded-lg', 'border']))
        expect(surface.find('table').exists()).toBe(true)
        expect(surface.find('[data-slot="pagination"]').exists()).toBe(true)
        expect(surface.find('[data-toolbar]').exists()).toBe(false)
        expect(wrapper.find('[data-toolbar]').exists()).toBe(true)
    })

    it('uses the new-api muted row surface for hover and selected states', () => {
        const wrapper = mountTable({ selectable: true, selectedKeys: [1] })
        const row = wrapper.get('tbody tr')
        expect(row.classes()).toEqual(expect.arrayContaining([
            'data-[state=selected]:bg-muted',
            'hover:[background-color:color-mix(in_oklch,var(--muted)_50%,var(--background))]',
        ]))
        expect(row.attributes('data-state')).toBe('selected')
    })

    it('uses the new-api compact header and cell density', () => {
        const wrapper = mountTable({ selectable: true }, { actions: '操作' })
        expect(wrapper.get('thead th[data-column-id="selection"]').classes()).toContain('px-2')
        expect(wrapper.get('thead th[data-column-id="name"]').classes()).toContain('px-2')
        expect(wrapper.get('tbody td[data-column-id="selection"]').classes()).toContain('p-2')
        expect(wrapper.get('tbody td[data-column-id="name"]').classes()).toContain('p-2')
        expect(wrapper.get('tbody td[data-column-id="actions"]').classes()).toContain('p-2')
    })

    it('supports controlled row selection and current-page select-all state', async () => {
        const wrapper = mountTable({ selectable: true }, {
                'cell-name': ({ value }: { value: unknown }) => `slot:${String(value)}`,
        })

        expect(wrapper.text()).toContain('slot:one')
        expect(wrapper.text()).not.toContain('a')

        const checkboxes = wrapper.findAll('input[type="checkbox"]')
        await checkboxes[1].setValue(true)
        expect(wrapper.emitted('selection-change')?.at(-1)).toEqual([[1]])
        expect((checkboxes[0].element as HTMLInputElement).indeterminate).toBe(true)

        await checkboxes[0].setValue(true)
        expect(wrapper.emitted('update:selectedKeys')?.at(-1)).toEqual([[1, 2]])
        expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
    })

    it('clears stale controlled keys when the page-scoped rows change', async () => {
        const wrapper = mountTable({ selectable: true, selectedKeys: [1], page: 1 })

        await wrapper.setProps({ data: [{ id: 3, name: 'three', kind: 'c' }], page: 2 })
        expect(wrapper.emitted('update:selectedKeys')?.at(-1)).toEqual([[]])
    })

    it('renders toolbar and row actions only when their slots are provided', () => {
        const wrapper = mountTable({}, {
            toolbar: '表格工具栏',
            actions: ({ row, rowKey }: { row: Record<string, unknown>; rowKey: string | number }) => `编辑 ${String(row.id)} (${String(rowKey)})`,
        })

        expect(wrapper.text()).toContain('表格工具栏')
        expect(wrapper.text()).toContain('编辑 1 (1)')
        expect(wrapper.findAll('thead th')).toHaveLength(2)
        expect(wrapper.findAll('tbody td')).toHaveLength(4)

        const withoutActions = mountTable()
        expect(withoutActions.findAll('thead th')).toHaveLength(1)
    })

    it('renders the new-api empty surface with configurable content and actions', () => {
        const wrapper = mountTable({
            data: [],
            emptyTitle: '没有渠道',
            emptyDescription: '调整筛选条件后重试',
            emptyIcon: 'lucide:inbox',
        }, {
            'empty-action': '<button type="button">清除筛选</button>',
        })

        expect(wrapper.get('[data-slot="empty"]').classes()).toContain('border-0')
        expect(wrapper.get('[data-slot="empty-title"]').text()).toBe('没有渠道')
        expect(wrapper.get('[data-slot="empty-description"]').text()).toBe('调整筛选条件后重试')
        expect(wrapper.get('tbody td').classes()).toContain('h-[400px]')
        expect(wrapper.text()).toContain('清除筛选')
    })

    it('exposes a single accessible state surface for loading, error and empty data', () => {
        const loading = mountTable({ loading: true })
        expect(loading.get('[data-slot="data-table-surface"]').attributes('aria-busy')).toBe('true')
        expect(loading.get('[role="status"]').text()).toContain('加载中')

        const error = mountTable({ error: new Error('failed') })
        expect(error.get('[role="alert"]').text()).toContain('加载失败')

        const empty = mountTable({ data: [] })
        expect(empty.get('[role="status"]').text()).toContain('暂无')
    })

    it('keeps legacy emptyText and custom empty slots compatible', () => {
        const legacy = mountTable({ data: [], emptyText: '自定义暂无数据' })
        expect(legacy.get('[data-slot="empty-title"]').text()).toBe('自定义暂无数据')

        const custom = mountTable({ data: [] }, { empty: '<span data-custom-empty>自定义空内容</span>' })
        expect(custom.get('[data-custom-empty]').text()).toBe('自定义空内容')
        expect(custom.find('[data-slot="empty"]').exists()).toBe(false)
    })

    it('uses the configured stable row key for selection and DOM identity', async () => {
        const wrapper = mountTable({
            selectable: true,
            rowKey: (row: Record<string, unknown>) => String(row.uuid),
            data: [{ uuid: 'a', name: 'A' }, { uuid: 'b', name: 'B' }],
        })

        await wrapper.find('tbody input[type="checkbox"]').trigger('change')
        expect(wrapper.emitted('selection-change')?.at(-1)).toEqual([['a']])

        await wrapper.setProps({ data: [{ uuid: 'b', name: 'B' }, { uuid: 'a', name: 'A' }] })
        const rowCheckboxes = wrapper.findAll('tbody input[type="checkbox"]')
        expect((rowCheckboxes[0]?.element as HTMLInputElement).checked).toBe(false)
        expect((rowCheckboxes[1]?.element as HTMLInputElement).checked).toBe(true)
    })

    it('fails fast when a row does not expose a stable key', () => {
        expect(() => mountTable({ data: [{ name: 'missing id' }] })).toThrow(/stable row key/i)
        expect(() => mountTable({ data: [{ id: 1, name: 'one' }, { id: 1, name: 'duplicate' }] })).toThrow(/unique/i)
    })

    it('supports formatter, manual sort, pagination and retry actions', async () => {
        const wrapper = mountTable({
            columns: [{ key: 'name', title: '名称', sortable: true, formatter: (value: unknown) => `格式化:${String(value)}` }],
            data: [{ id: 2, name: 'two' }, { id: 1, name: 'one' }],
            manualSort: true,
            pagination: true,
            page: 1,
            pageSize: 1,
            total: 2,
        })

        expect(wrapper.text()).toContain('格式化:two')
        await wrapper.get('[data-slot="data-table-column-header-trigger"]').trigger('click')
        await nextTick()
        const ascItem = document.body.querySelector('[data-slot="data-table-column-header-sort-asc"]') as HTMLElement
        expect(ascItem).not.toBeNull()
        ascItem.click()
        await nextTick()
        expect(wrapper.emitted('sort-change')?.at(-1)).toEqual([{ key: 'name', direction: 'asc' }])
        expect(wrapper.find('tbody tr').text()).toContain('格式化:two')

        const nextPage = wrapper.get('[aria-label="Go to next page"]')
        await nextPage.trigger('click')
        expect(wrapper.emitted('update:page')?.at(-1)).toEqual([2])

        const errorWrapper = mountTable({ error: new Error('failed') })
        await errorWrapper.find('tbody button').trigger('click')
        expect(errorWrapper.emitted('retry')).toHaveLength(1)
    })

    it('matches the new-api column header menu and exposes explicit sort actions', async () => {
        const wrapper = mountTable()
        const trigger = wrapper.get('[data-slot="data-table-column-header-trigger"]')
        expect(trigger.classes()).toEqual(expect.arrayContaining(['h-8', 'data-popup-open:bg-accent']))
        expect(trigger.attributes('aria-label')).toBe('名称')

        await trigger.trigger('click')
        await nextTick()
        expect(document.body.querySelector('[data-slot="data-table-column-header-menu"]')).not.toBeNull()
        const descItem = document.body.querySelector('[data-slot="data-table-column-header-sort-desc"]') as HTMLElement
        descItem.click()
        await nextTick()
        expect(wrapper.emitted('sort-change')?.at(-1)).toEqual([{ key: 'name', direction: 'desc' }])
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        wrapper.unmount()
    })

    it('hides columns through the header menu while respecting hideable=false', async () => {
        const wrapper = mountTable({
            columns: [
                { key: 'name', title: '名称', sortable: true },
                { key: 'kind', title: '类型', sortable: true, hideable: false },
            ],
        })
        await wrapper.get('[data-slot="data-table-column-header-trigger"]').trigger('click')
        await nextTick()
        expect(document.body.querySelector('[data-slot="data-table-column-header-hide"]')).not.toBeNull()
        const hideItem = document.body.querySelector('[data-slot="data-table-column-header-hide"]') as HTMLElement
        hideItem.click()
        await nextTick()
        expect(wrapper.emitted('update:columnVisibility')?.at(-1)).toEqual([{ name: false, kind: true }])
        expect(wrapper.find('th[data-column-id="name"]').exists()).toBe(false)

        const remainingTrigger = wrapper.get('[data-slot="data-table-column-header-trigger"]')
        await remainingTrigger.trigger('click')
        await nextTick()
        expect(document.body.querySelector('[data-slot="data-table-column-header-hide"]')).toBeNull()
        wrapper.unmount()
    })

    it('supports controlled column visibility for view-option integrations', async () => {
        const wrapper = mountTable({ columnVisibility: { name: false } })
        expect(wrapper.findAll('thead th')).toHaveLength(0)

        await wrapper.setProps({ columnVisibility: { name: true } })
        expect(wrapper.findAll('thead th')).toHaveLength(1)
    })

    it('supports bounded column sizing through the resize handle', async () => {
        const wrapper = mountTable({
            columns: [{ key: 'name', title: '名称', resizable: true, minSize: 100, maxSize: 220 }],
        })
        const handle = wrapper.find('th span.cursor-col-resize')
        expect(handle.exists()).toBe(true)
        await handle.trigger('pointerdown', { clientX: 100 })
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 350 }))
        expect(wrapper.emitted('update:columnSizing')?.at(-1)?.[0]).toEqual({ name: 220 })
        window.dispatchEvent(new PointerEvent('pointerup', { clientX: 350 }))
    })

    it('exposes a keyboard resize separator with bounded and auto-size controls', async () => {
        const wrapper = mountTable({
            columns: [{ key: 'name', title: '名称', width: '120px', resizable: true, minSize: 100, maxSize: 220 }],
        })
        const handle = wrapper.find('[data-column-resizer]')
        expect(handle.attributes('role')).toBe('separator')
        expect(handle.attributes('aria-orientation')).toBe('vertical')
        expect(handle.attributes('aria-label')).toBe('调整列宽：名称')
        expect(handle.attributes('tabindex')).toBe('0')

        await handle.trigger('keydown', { key: 'ArrowRight' })
        expect(wrapper.emitted('update:columnSizing')?.at(-1)?.[0]).toEqual({ name: 130 })
        await handle.trigger('keydown', { key: 'ArrowLeft', shiftKey: true })
        expect(wrapper.emitted('update:columnSizing')?.at(-1)?.[0]).toEqual({ name: 100 })

        const originalScrollWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth')
        Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, get: () => 180 })
        await handle.trigger('keydown', { key: 'Enter' })
        expect(wrapper.emitted('update:columnSizing')?.at(-1)?.[0]).toEqual({ name: 180 })
        Object.defineProperty(HTMLElement.prototype, 'scrollWidth', originalScrollWidth ?? { configurable: true, value: 0 })
        vi.restoreAllMocks()
    })

    it('migrates persisted sizing to the current schema and bounds', async () => {
        localStorage.setItem('data-table-sizing-migration', '{"name":400,"removed":180}')
        const wrapper = mountTable({
            columns: [{ key: 'name', title: '名称', resizable: true, minSize: 100, maxSize: 220 }],
            columnSizingStorageKey: 'data-table-sizing-migration',
        })
        await nextTick()
        expect(wrapper.find('thead th[data-column-id="name"]').attributes('style')).toContain('width: 220px')
        expect(JSON.parse(localStorage.getItem('data-table-sizing-migration') ?? '{}')).toEqual({ name: 220 })
        localStorage.removeItem('data-table-sizing-migration')
    })

    it('migrates persisted pinning to current columns and sides', async () => {
        localStorage.setItem('data-table-pinning-migration', '{"name":"left","removed":"right","bad":"middle"}')
        const wrapper = mountTable({
            columns: [{ key: 'name', title: '名称', width: '180px' }],
            columnPinningStorageKey: 'data-table-pinning-migration',
        })
        await nextTick()
        expect(wrapper.find('thead th[data-column-id="name"]').attributes('style')).toContain('left: 0px')
        expect(JSON.parse(localStorage.getItem('data-table-pinning-migration') ?? '{}')).toEqual({ name: 'left' })
        localStorage.removeItem('data-table-pinning-migration')
    })

    it('pins visible headers and cells with cumulative left/right offsets', async () => {
        const wrapper = mountTable({
            columns: [
                { key: 'name', title: '名称', width: '180px' },
                { key: 'kind', title: '类型', width: '120px' },
                { key: 'status', title: '状态', width: '100px' },
            ],
            selectable: true,
            columnPinning: { selection: 'left', name: 'left', kind: 'left', actions: 'right' },
        }, { actions: '操作' })

        expect(wrapper.find('thead th[data-column-id="selection"]').attributes('style')).toContain('left: 0px')
        expect(wrapper.find('thead th[data-column-id="name"]').attributes('style')).toContain('left: 40px')
        expect(wrapper.find('thead th[data-column-id="actions"]').attributes('style')).toContain('right: 0px')
        expect(wrapper.find('tbody td[data-column-id="name"]').attributes('style')).toContain('left: 40px')

        await wrapper.setProps({ columnVisibility: { name: false } })
        expect(wrapper.find('thead th[data-column-id="kind"]').exists()).toBe(true)
        expect(wrapper.find('thead th[data-column-id="kind"]').attributes('style')).toContain('left: 40px')
        expect(wrapper.find('thead th[data-column-id="name"]').exists()).toBe(false)
    })

    it('restores uncontrolled pinning state from localStorage', async () => {
        localStorage.setItem('data-table-pinning-test', '{"name":"left","actions":"right"}')
        const wrapper = mountTable({
            columns: [
                { key: 'name', title: '名称', width: '180px' },
                { key: 'kind', title: '类型' },
            ],
            columnPinningStorageKey: 'data-table-pinning-test',
        }, { actions: '操作' })
        await nextTick()

        expect(wrapper.find('thead th[data-column-id="name"]').attributes('style')).toContain('left: 0px')
        expect(wrapper.find('thead th[data-column-id="actions"]').attributes('style')).toContain('right: 0px')
        localStorage.removeItem('data-table-pinning-test')
    })

    it('keeps persistent selection keys across page data changes', async () => {
        const wrapper = mountTable({ selectable: true, selectionScope: 'persistent', selectedKeys: [1], data: [{ id: 2, name: 'two' }] })
        await wrapper.find('tbody input[type="checkbox"]').setValue(true)
        expect(wrapper.emitted('selection-change')?.at(-1)).toEqual([[1, 2]])

        await wrapper.setProps({ data: [{ id: 3, name: 'three' }] })
        expect(wrapper.emitted('update:selectedKeys')?.at(-1)).toEqual([[1, 2]])
    })
})
