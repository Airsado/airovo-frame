import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import { afterEach, describe, expect, it } from 'vitest'
import DataTablePage from './DataTablePage.vue'

const global = {
  plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { viewMode: '视图模式', cardView: '卡片视图', tableView: '表格视图' } } } })],
  stubs: {
    FrameworkTooltip: { template: '<span><slot name="trigger" /></span>' },
    Icon: true,
  },
}

afterEach(() => localStorage.clear())

describe('DataTablePage view mode', () => {
  it('switches the shared table/card slots and persists an uncontrolled mode', async () => {
    const wrapper = mount(DataTablePage, {
      global,
      props: { enableViewModeToggle: true, viewModeStorageKey: 'view-mode-test' },
      slots: { toolbar: '<span data-toolbar>toolbar</span>', table: '<div data-table>table</div>', mobile: '<div data-card>card</div>' },
    })

    expect(wrapper.find('[data-table]').exists()).toBe(true)
    expect(wrapper.find('[data-card]').exists()).toBe(false)
    await wrapper.get('button[aria-label="卡片视图"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-table]').exists()).toBe(false)
    expect(wrapper.find('[data-card]').exists()).toBe(true)
    expect(localStorage.getItem('view-mode-test')).toBe('card')
    expect(wrapper.emitted('update:viewMode')?.at(-1)).toEqual(['card'])

    const restored = mount(DataTablePage, {
      global,
      props: { enableViewModeToggle: true, viewModeStorageKey: 'view-mode-test' },
      slots: { table: '<div data-table>table</div>', mobile: '<div data-card>card</div>' },
    })
    await nextTick()
    expect(restored.find('[data-table]').exists()).toBe(false)
    expect(restored.find('[data-card]').exists()).toBe(true)
  })

  it('supports a controlled mode without changing the parent value implicitly', async () => {
    const wrapper = mount(DataTablePage, {
      global,
      props: { enableViewModeToggle: true, viewMode: 'card' },
      slots: { table: '<div data-table>table</div>', mobile: '<div data-card>card</div>' },
    })

    expect(wrapper.find('[data-card]').exists()).toBe(true)
    await wrapper.get('button[aria-label="表格视图"]').trigger('click')
    expect(wrapper.emitted('update:viewMode')?.at(-1)).toEqual(['table'])
    expect(wrapper.find('[data-card]').exists()).toBe(true)
  })

  it('automatically renders DataTableCardGrid when card rows and columns are provided', async () => {
    const wrapper = mount(DataTablePage, {
      global,
      props: {
        enableViewModeToggle: true,
        viewMode: 'card',
        cardRows: [{ id: 1, name: 'one', status: 'ready' }],
        cardColumns: [
          { key: 'name', title: '名称', mobileTitle: true },
          { key: 'status', title: '状态', mobileBadge: true },
        ],
        cardRowKey: 'id',
        cardSelectable: true,
      },
      slots: {
        table: '<div data-table>table</div>',
        'card-cell-status': '<strong data-status>{{ value }}</strong>',
        'card-actions': '<span data-actions>actions</span>',
      },
    })

    expect(wrapper.find('[data-slot="data-table-card"]').exists()).toBe(true)
    expect(wrapper.get('[data-status]').text()).toBe('ready')
    expect(wrapper.get('[data-actions]').text()).toBe('actions')
    await wrapper.get('input[type="checkbox"]').setValue(true)
    expect(wrapper.emitted('update:cardSelectedKeys')?.at(-1)).toEqual([[1]])
  })

  it('uses the automatic mobile list fallback for mobileCards without a mobile slot', () => {
    const wrapper = mount(DataTablePage, {
      global,
      props: {
        mobileCards: true,
        cardRows: [{ id: 1, name: 'one' }],
        cardColumns: [{ key: 'name', title: '名称' }],
      },
      slots: { table: '<div data-table>table</div>' },
    })

    expect(wrapper.find('[data-slot="data-table-mobile-card-list"]').exists()).toBe(true)
    expect(wrapper.find('[data-slot="data-table-mobile-row"]').exists()).toBe(true)
    expect(wrapper.find('[data-table]').exists()).toBe(true)
    expect(wrapper.find('[data-table]').element.parentElement?.className).toContain('hidden')
  })

  it('shares rows, selection and request state between the built-in table and cards', async () => {
    const wrapper = mount(DataTablePage, {
      global,
      props: {
        rows: [{ id: 1, name: 'one' }],
        columns: [{ key: 'name', title: '名称', mobileTitle: true }],
        rowKey: 'id',
        selectable: true,
        mobileCards: true,
        enableViewModeToggle: true,
        viewMode: 'card',
        pagination: true,
        page: 1,
        pageSize: 1,
        total: 2,
      },
    })

    expect(wrapper.get('[aria-label="Go to next page"]').exists()).toBe(true)
    await wrapper.get('[aria-label="Go to next page"]').trigger('click')
    expect(wrapper.emitted('update:page')?.at(-1)).toEqual([2])
    await wrapper.get('input[type="checkbox"]').setValue(true)
    expect(wrapper.emitted('update:selectedKeys')?.at(-1)).toEqual([[1]])

    await wrapper.setProps({ viewMode: 'table' })
    await nextTick()
    expect(wrapper.find('table').exists()).toBe(true)
    expect((wrapper.find('tbody input[type="checkbox"]').element as HTMLInputElement).checked).toBe(true)
  })

  it('keeps shared error and retry state available in card view', async () => {
    const wrapper = mount(DataTablePage, {
      global,
      props: {
        rows: [{ id: 1, name: 'one' }],
        columns: [{ key: 'name', title: '名称', mobileTitle: true }],
        mobileCards: true,
        viewMode: 'card',
        error: new Error('failed'),
      },
    })

    expect(wrapper.get('[role="alert"]').text()).toContain('加载失败')
    await wrapper.get('[role="alert"] button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('preserves legacy card row-key indexes when rendering the automatic table', () => {
    const wrapper = mount(DataTablePage, {
      global,
      props: {
        rows: [{ name: 'one' }, { name: 'two' }],
        columns: [{ key: 'name', title: '名称' }],
        cardRowKey: (_row: Record<string, unknown>, index: number) => `row-${index}`,
        selectable: true,
      },
    })

    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.findAll('tbody input[type="checkbox"]')).toHaveLength(2)
  })

  it('composes the built-in toolbar from shared table columns and loading state', async () => {
    const wrapper = mount(DataTablePage, {
      global: {
        ...global,
        stubs: {
          ...global.stubs,
          DataTableToolbar: {
            props: ['columns', 'loading', 'modelValue'],
            emits: ['update:modelValue', 'update:filterValues', 'reset', 'refresh', 'update:columnVisibility'],
            template: '<div data-toolbar-proxy :data-column-count="columns?.length" :data-loading="String(loading)"><button type="button" @click="$emit(\'update:modelValue\', \'next\')">search</button><button type="button" @click="$emit(\'refresh\')">refresh</button><button type="button" @click="$emit(\'update:filterValues\', { status: [\'ready\'] })">filter</button><button type="button" @click="$emit(\'update:columnVisibility\', { name: false })">columns</button></div>',
          },
        },
      },
      props: {
        rows: [{ id: 1, name: 'one' }],
        columns: [{ key: 'name', title: '名称' }],
        loading: true,
        toolbarProps: { modelValue: 'initial' },
      },
    })

    const toolbar = wrapper.get('[data-toolbar-proxy]')
    expect(toolbar.attributes('data-column-count')).toBe('1')
    expect(toolbar.attributes('data-loading')).toBe('true')
    await toolbar.get('button').trigger('click')
    expect(wrapper.emitted('update:toolbarModelValue')?.at(-1)).toEqual(['next'])
    await wrapper.findAll('[data-toolbar-proxy] button')[1]!.trigger('click')
    expect(wrapper.emitted('toolbar-refresh')).toHaveLength(1)
    await wrapper.findAll('[data-toolbar-proxy] button')[2]!.trigger('click')
    expect(wrapper.emitted('update:toolbarFilterValues')?.at(-1)).toEqual([{ status: ['ready'] }])
    await wrapper.findAll('[data-toolbar-proxy] button')[3]!.trigger('click')
    expect(wrapper.emitted('update:columnVisibility')?.at(-1)).toEqual([{ name: false }])
  })
})
