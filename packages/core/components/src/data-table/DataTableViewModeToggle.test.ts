import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import DataTableViewModeToggle from './DataTableViewModeToggle.vue'

const global = {
  plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { viewMode: '视图模式', cardView: '卡片视图', tableView: '表格视图' } } } })],
  stubs: {
    FrameworkTooltip: { template: '<span><slot name="trigger" /></span>' },
    Icon: true,
  },
}

describe('DataTableViewModeToggle', () => {
  it('renders new-api table/card states with accessible pressed buttons', async () => {
    const wrapper = mount(DataTableViewModeToggle, { global })

    expect(wrapper.get('[data-slot="data-table-view-mode-toggle"]').attributes('role')).toBe('group')
    expect(wrapper.get('button[aria-label="表格视图"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('button[aria-label="卡片视图"]').attributes('aria-pressed')).toBe('false')

    await wrapper.get('button[aria-label="卡片视图"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['card'])
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['card'])
  })

  it('keeps the selected mode stable while disabled', async () => {
    const wrapper = mount(DataTableViewModeToggle, { global, props: { modelValue: 'card', disabled: true } })

    await wrapper.get('button[aria-label="表格视图"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.get('button[aria-label="卡片视图"]').attributes('aria-pressed')).toBe('true')
  })
})
