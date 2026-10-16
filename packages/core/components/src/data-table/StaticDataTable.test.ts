// @vitest-environment happy-dom
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import StaticDataTable from './StaticDataTable.vue'
import { staticDataTableClassNames } from './static-data-table-classnames'

const rows = [
    { id: 'a', name: 'Alpha', status: '运行中' },
    { id: 'b', name: 'Beta', status: '已停用' },
]
const columns = [
    { id: 'name', header: '名称', cell: (row: typeof rows[number]) => row.name },
    { id: 'status', header: '状态', cell: (row: typeof rows[number]) => h('span', { class: 'status-value' }, row.status) },
]

function mountTable(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
    return mount(StaticDataTable, {
        props: { columns, data: rows, ...props },
        slots,
        global: {
            plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': {} } })],
        },
    })
}

describe('StaticDataTable', () => {
    it('renders the new-api bordered surface, columns and local rows', () => {
        const wrapper = mountTable({
            className: 'surface-extra',
            tableClassName: 'table-extra',
            containerProps: { class: 'container-extra', 'data-container': 'yes' },
            tableProps: { class: 'table-prop-extra', 'data-table-prop': 'yes', withContainer: true },
        })

        expect(wrapper.get('[data-slot="static-data-table-container"]').classes()).toEqual(expect.arrayContaining([
            'overflow-hidden', 'rounded-md', 'border', 'surface-extra',
        ]))
        expect(wrapper.get('[data-slot="static-data-table-container"]').classes()).toContain('container-extra')
        expect(wrapper.get('[data-slot="static-data-table-container"]').attributes('data-container')).toBe('yes')
        expect(wrapper.get('[data-slot="static-data-table"]').classes()).toEqual(expect.arrayContaining([
            'relative', 'overflow-x-auto', 'overflow-y-hidden',
        ]))
        expect(wrapper.get('[data-slot="static-data-table"]').attributes('data-table-prop')).toBe('yes')
        expect(wrapper.get('[data-slot="table"]').classes()).toContain('table-extra')
        expect(wrapper.get('[data-slot="table"]').classes()).toContain('table-prop-extra')
        expect(wrapper.get('[data-slot="table"]').attributes('data-slot')).toBe('table')
        expect(wrapper.findAll('thead th').map((item) => item.text())).toEqual(['名称', '状态'])
        expect(wrapper.findAll('tbody tr')).toHaveLength(2)
        expect(wrapper.text()).toContain('Alpha')
        expect(wrapper.text()).toContain('已停用')
    })

    it('supports row keys, row and cell class callbacks, and custom VNode cells', () => {
        const wrapper = mountTable({
            getRowKey: (row: typeof rows[number]) => row.id,
            getRowClassName: (row: typeof rows[number]) => row.id === 'b' ? 'muted-row' : undefined,
            columns: [{
                id: 'name',
                header: '名称',
                cellClassName: (row: typeof rows[number]) => row.id === 'a' ? 'name-cell' : undefined,
                cell: (row: typeof rows[number]) => h('span', { class: 'name-value' }, row.name),
            }],
        })

        expect(wrapper.get('tbody tr').attributes('class')).not.toContain('muted-row')
        expect(wrapper.findAll('tbody tr')[1].classes()).toContain('muted-row')
        expect(wrapper.get('tbody td').classes()).toContain('name-cell')
        expect(wrapper.get('.name-value').text()).toBe('Alpha')
        expect(wrapper.findAll('[data-slot="tooltip-trigger"]')).toHaveLength(2)
    })

    it('renders an empty row and forwards empty slot content', () => {
        const wrapper = mountTable({ data: [], emptyClassName: 'empty-cell' }, {
            empty: '<span data-empty>没有记录</span>',
        })

        const row = wrapper.get('[data-slot="static-data-table-empty-row"]')
        expect(row.get('td').classes()).toContain('empty-cell')
        expect(row.get('[data-empty]').text()).toBe('没有记录')
    })

    it('allows an explicit empty=false to render an empty array without the fallback row', () => {
        const wrapper = mountTable({ data: [], empty: false })

        expect(wrapper.find('[data-slot="static-data-table-empty-row"]').exists()).toBe(false)
        expect(wrapper.findAll('tbody tr')).toHaveLength(0)
    })

    it('supports children mode for pre-composed table content', () => {
        const wrapper = mount(StaticDataTable, {
            slots: { default: '<tbody><tr><td>自定义行</td></tr></tbody>' },
        })

        expect(wrapper.find('tbody td').text()).toBe('自定义行')
        expect(wrapper.find('thead').exists()).toBe(false)
    })

    it('lets a row slot provide complete row markup before renderRow', () => {
        const wrapper = mountTable({
            renderRow: () => h('tr', { class: 'rendered-row' }, h('td', 'renderRow')),
        }, {
            row: ({ row, index }: { row: typeof rows[number]; index: number }) => h('tr', { class: 'slotted-row' }, [
                h('td', `${row.name}-${index}`),
            ]),
        })

        expect(wrapper.findAll('tbody tr')).toHaveLength(2)
        expect(wrapper.find('tbody tr').classes()).toContain('slotted-row')
        expect(wrapper.text()).toContain('Alpha-0')
        expect(wrapper.text()).not.toContain('renderRow')
    })

    it('exports the complete new-api class map', () => {
        expect(staticDataTableClassNames.container).toBe('overflow-hidden rounded-md border')
        expect(staticDataTableClassNames.compactMutedNumericCell).toContain('font-mono')
        expect(staticDataTableClassNames.actionCell).toContain('text-right')
    })
})
