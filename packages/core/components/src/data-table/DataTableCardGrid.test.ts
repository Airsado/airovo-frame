import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import DataTableCardGrid from './DataTableCardGrid.vue'
import type { DataTableColumn } from './types'

interface Row extends Record<string, unknown> {
  id: number
  name: string
  type: string
  status: string
  secret: string
}

const columns: DataTableColumn<Row>[] = [
  { key: 'name', title: '名称', mobileTitle: true, mobileOrder: 1 },
  { key: 'status', title: '状态', mobileBadge: true },
  { key: 'type', title: '类型', mobileOrder: 2 },
  { key: 'secret', title: '内部字段', mobileHidden: true },
]
const rows: Row[] = [{ id: 1, name: '渠道一', type: 'OpenAI', status: '运行中', secret: 'hidden' }]
const global = { plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { noData: '暂无数据', noDataDescription: '暂无描述', loading: '加载中…', selectRow: '选择第 {index} 行' } } } })] }

describe('DataTableCardGrid', () => {
  it('renders a new-api compact card from column metadata and cell slots', () => {
    const wrapper = mount(DataTableCardGrid, {
      global,
      props: { rows, columns, selectable: true },
      slots: { 'cell-status': '<strong data-status>{{ value }}</strong>' },
    })

    const card = wrapper.get('[data-slot="data-table-card"]')
    expect(card.text()).toContain('渠道一')
    expect(card.text()).toContain('类型')
    expect(card.text()).toContain('OpenAI')
    expect(card.text()).not.toContain('hidden')
    expect(card.get('[data-status]').text()).toBe('运行中')
  })

  it('supports loading, empty and selection states', async () => {
    const loading = mount(DataTableCardGrid, { global, props: { rows, columns, loading: true } })
    expect(loading.findAll('[data-slot="data-table-card"]')).toHaveLength(0)
    expect(loading.get('[aria-busy="true"]')).toBeTruthy()
    expect(loading.get('[role="status"]').text()).toContain('加载中')

    const empty = mount(DataTableCardGrid, { global, props: { rows: [], columns } })
    expect(empty.text()).toContain('暂无数据')
    expect(empty.get('[role="status"]').text()).toContain('暂无数据')
    expect(empty.get('[role="status"]').attributes('aria-live')).toBe('polite')

    const selected = mount(DataTableCardGrid, { global, props: { rows, columns, selectable: true } })
    await selected.get('input[type="checkbox"]').setValue(true)
    expect(selected.emitted('update:selectedKeys')?.at(-1)).toEqual([[1]])
    expect(selected.get('[data-slot="data-table-card"]').attributes('data-state')).toBe('selected')
  })

  it('requires stable unique row keys and keeps selection attached after reordering', async () => {
    expect(() => mount(DataTableCardGrid, { global, props: { rows: [{ name: 'missing' }], columns } })).toThrow(/stable row key/i)
    expect(() => mount(DataTableCardGrid, { global, props: { rows: [{ id: '' }, { id: 2 }], columns } })).toThrow(/stable row key/i)
    expect(() => mount(DataTableCardGrid, { global, props: { rows: [{ id: Number.NaN }], columns } })).toThrow(/stable row key/i)
    expect(() => mount(DataTableCardGrid, { global, props: { rows: [{ id: Number.POSITIVE_INFINITY }], columns } })).toThrow(/stable row key/i)
    expect(() => mount(DataTableCardGrid, { global, props: { rows: [{ id: 1 }, { id: 1 }], columns } })).toThrow(/unique/i)
    expect(() => mount(DataTableCardGrid, { global, props: { rows: [{ id: 1 }, { id: '1' }], columns } })).toThrow(/unique/i)

    const reorderRows: Row[] = [
      rows[0],
      { id: 2, name: '渠道二', type: 'Anthropic', status: '待机', secret: 'hidden' },
    ]
    const wrapper = mount(DataTableCardGrid, { global, props: { rows: reorderRows, columns, selectable: true } })
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await wrapper.setProps({ rows: [reorderRows[1], reorderRows[0]] })
    expect(wrapper.findAll('[data-slot="data-table-card"]')[1].attributes('data-state')).toBe('selected')

    const custom = mount(DataTableCardGrid, {
      global,
      props: { rows: reorderRows, columns, selectable: true, rowKey: (row: Row) => row.name },
    })
    await custom.get('input[type="checkbox"]').setValue(true)
    await custom.setProps({ rows: [reorderRows[1], reorderRows[0]] })
    expect(custom.findAll('[data-slot="data-table-card"]')[1].attributes('data-state')).toBe('selected')
  })

  it('uses the same accessible error and retry contract as DataTable', async () => {
    const wrapper = mount(DataTableCardGrid, { global, props: { rows, columns, error: new Error('failed') } })
    expect(wrapper.get('[role="alert"]').text()).toContain('加载失败')
    expect(wrapper.get('[role="alert"]').attributes('aria-live')).toBe('assertive')
    await wrapper.get('[role="alert"] button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('interpolates the localized row selection label', () => {
    const wrapper = mount(DataTableCardGrid, { global, props: { rows, columns, selectable: true } })
    expect(wrapper.get('input[type="checkbox"]').attributes('aria-label')).toBe('选择第 1 行')
  })

  it('allows a custom card slot while exposing the row selection helper', async () => {
    const wrapper = mount(DataTableCardGrid, {
      global,
      props: { rows, columns, selectable: true },
      slots: { card: '<button data-custom @click="toggleRow()">{{ row.name }} {{ selected ? "selected" : "idle" }}</button>' },
    })

    expect(wrapper.get('[data-custom]').text()).toContain('idle')
    await wrapper.get('[data-custom]').trigger('click')
    expect(wrapper.emitted('update:selectedKeys')?.at(-1)).toEqual([[1]])
  })
})
