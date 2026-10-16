import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import DataTableMobileCardList from './DataTableMobileCardList.vue'
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
const rows: Row[] = [
  { id: 1, name: '渠道一', type: 'OpenAI', status: '运行中', secret: 'hidden' },
  { id: 2, name: '渠道二', type: 'Claude', status: '待机', secret: 'hidden' },
]
const global = {
  plugins: [createI18n({
    legacy: false,
    locale: 'zh-CN',
    messages: {
      'zh-CN': {
        common: {
          noData: '暂无数据',
          noDataDescription: '暂无描述',
          loading: '加载中…',
          errorLoading: '加载失败',
          retry: '重试',
          selectCurrentPage: '全选当前页',
          selectRow: '选择第 {index} 行',
        },
      },
    },
  })],
}

describe('DataTableMobileCardList', () => {
  it('renders the new-api single bordered list and compact metadata', () => {
    const wrapper = mount(DataTableMobileCardList, {
      global,
      props: { rows, columns, selectable: true },
      slots: { 'cell-status': '<strong data-status>{{ value }}</strong>' },
    })

    expect(wrapper.get('[data-slot="data-table-mobile-card-list"] > .divide-y').classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border']))
    expect(wrapper.findAll('[data-slot="data-table-mobile-row"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('渠道一')
    expect(wrapper.text()).toContain('OpenAI')
    expect(wrapper.text()).not.toContain('hidden')
    expect(wrapper.get('[data-status]').text()).toBe('运行中')
    expect(wrapper.get('[data-slot="data-table-mobile-row"]').classes()).toEqual(expect.arrayContaining(['px-3', 'py-2.5']))
  })

  it('supports current-page select-all and indeterminate state', async () => {
    const wrapper = mount(DataTableMobileCardList, {
      global,
      props: { rows, columns, selectable: true },
    })

    const selectAll = wrapper.get('[data-slot="data-table-mobile-select-all"] input')
    expect((selectAll.element as HTMLInputElement).checked).toBe(false)
    await wrapper.get('[data-slot="data-table-mobile-row"] input').setValue(true)
    expect((selectAll.element as HTMLInputElement).indeterminate).toBe(true)
    await selectAll.setValue(true)
    expect(wrapper.emitted('update:selectedKeys')?.at(-1)).toEqual([[1, 2]])
    expect((selectAll.element as HTMLInputElement).checked).toBe(true)
    await selectAll.setValue(false)
    expect(wrapper.emitted('update:selectedKeys')?.at(-1)).toEqual([[]])
  })

  it('keeps persistent selection across row replacement and page scope bounded', async () => {
    const persistent = mount(DataTableMobileCardList, {
      global,
      props: { rows, columns, selectable: true, selectionScope: 'persistent', selectedKeys: [1] },
    })
    await persistent.setProps({ rows: [rows[1]] })
    expect((persistent.get('[data-slot="data-table-mobile-row"] input').element as HTMLInputElement).checked).toBe(false)
    await persistent.get('[data-slot="data-table-mobile-row"] input').setValue(true)
    expect(persistent.emitted('update:selectedKeys')?.at(-1)).toEqual([[1, 2]])

    const page = mount(DataTableMobileCardList, {
      global,
      props: { rows, columns, selectable: true, selectedKeys: [1] },
    })
    await page.setProps({ rows: [rows[1]] })
    expect(page.emitted('update:selectedKeys')?.at(-1)).toEqual([[]])
  })

  it('keeps selection attached to stable keys after reorder and supports custom cards', async () => {
    const wrapper = mount(DataTableMobileCardList, {
      global,
      props: { rows, columns, selectable: true },
      slots: { card: '<button data-custom @click="toggleRow()">{{ row.name }} {{ selected ? "selected" : "idle" }}</button>' },
    })
    await wrapper.get('[data-custom]').trigger('click')
    expect(wrapper.emitted('update:selectedKeys')?.at(-1)).toEqual([[1]])
    await wrapper.setProps({ rows: [rows[1], rows[0]] })
    expect(wrapper.findAll('[data-custom]')[1].text()).toContain('selected')
  })

  it('renders compact and fallback loading, empty, and error/retry states', async () => {
    const compactLoading = mount(DataTableMobileCardList, { global, props: { columns, loading: true } })
    expect(compactLoading.get('[aria-busy="true"]')).toBeTruthy()
    expect(compactLoading.findAll('.divide-y > div')).toHaveLength(5)

    const fallbackLoading = mount(DataTableMobileCardList, { global, props: { columns: [{ key: 'name', title: '名称' }], loading: true } })
    expect(fallbackLoading.findAll('.divide-y > div')).toHaveLength(5)

    const empty = mount(DataTableMobileCardList, { global, props: { rows: [], columns } })
    expect(empty.get('[role="status"]').text()).toContain('暂无数据')

    const error = mount(DataTableMobileCardList, { global, props: { rows, columns, error: new Error('failed') } })
    await error.get('[role="alert"] button').trigger('click')
    expect(error.emitted('retry')).toHaveLength(1)
  })

  it('forwards pagination and card action slots', async () => {
    const wrapper = mount(DataTableMobileCardList, {
      global,
      props: { rows, columns, pagination: true, page: 1, pageSize: 1, total: 2 },
      slots: { 'card-actions': '<button data-actions>{{ row.name }}</button>' },
    })

    expect(wrapper.find('[data-actions]').text()).toBe('渠道一')
    await wrapper.get('[aria-label="Go to next page"]').trigger('click')
    expect(wrapper.emitted('update:page')?.at(-1)).toEqual([2])
  })
})
