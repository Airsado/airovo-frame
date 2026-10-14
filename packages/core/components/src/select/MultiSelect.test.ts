// @vitest-environment happy-dom
import { shallowMount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import MultiSelect from './MultiSelect.vue'

const stubs = {
  Popover: { template: '<div><slot /></div>' }, PopoverTrigger: { template: '<div><slot /></div>' }, PopoverContent: { template: '<div><slot /></div>' },
  Command: { template: '<div><slot /></div>' }, CommandInput: { props: ['modelValue', 'placeholder'], emits: ['update:modelValue', 'keydown'], template: '<input data-command-input :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown="$emit(\'keydown\', $event)" />' },
  CommandList: { template: '<div><slot /></div>' }, CommandEmpty: { template: '<div><slot /></div>' }, CommandGroup: { template: '<div><slot /></div>' }, CommandItem: { props: ['disabled'], emits: ['select'], template: '<button :disabled="disabled" @click="$emit(\'select\')"><slot /></button>' },
  Check: true, ChevronDown: true, X: true,
}

describe('MultiSelect', () => {
  const global = { stubs, plugins: [createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': { common: { multiSelectPlaceholder: 'Select items', multiSelectCreate: 'Add “{value}”', multiSelectEmpty: 'No items', remove: 'Remove', showAll: 'Show all', collapse: 'Collapse' } } } })] }

  it('uses the new-api chips/input surface and keeps hidden values compact', () => {
    const wrapper = shallowMount(MultiSelect, { global, props: { options: [{ label: 'One', value: 'one', hint: 'Primary' }, { label: 'Two', value: 'two' }], modelValue: ['one', 'two'], maxVisibleChips: 1 } })
    expect(wrapper.get('[role="combobox"]').classes()).toEqual(expect.arrayContaining(['rounded-md', 'border-input', 'bg-background']))
    expect(wrapper.get('input').attributes('aria-label')).toBe('Select items')
    expect(wrapper.get('input').attributes('placeholder')).toBeUndefined()
    expect(wrapper.text()).toContain('+1')
  })

  it('selects existing options from the inline input with Enter', async () => {
    const wrapper = shallowMount(MultiSelect, { global, props: { options: [{ label: 'One', value: 'one' }, { label: 'Two', value: 'two' }], modelValue: ['one'] } })
    const input = wrapper.get('input')
    await input.setValue('Two')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['one', 'two']])
  })

  it('creates a custom value and handles comma separated input', async () => {
    const wrapper = shallowMount(MultiSelect, { global, props: { allowCreate: true, modelValue: [] } })
    const input = wrapper.get('input')
    await input.setValue('alpha,beta,')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['alpha', 'beta']])
    await wrapper.setProps({ modelValue: ['alpha', 'beta'] })
    await input.setValue('gamma')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['alpha', 'beta', 'gamma']])
  })
})
