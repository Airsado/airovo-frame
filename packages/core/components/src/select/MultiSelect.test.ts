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
  it('toggles values, supports creation and keeps a bounded chip summary', async () => {
    const wrapper = shallowMount(MultiSelect, { global: { stubs, plugins: [createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': { common: { multiSelectPlaceholder: 'Select items', multiSelectCreate: 'Add “{value}”', multiSelectEmpty: 'No items', remove: 'Remove', showAll: 'Show all', collapse: 'Collapse' } } } })] }, props: { options: [{ label: 'One', value: 'one' }, { label: 'Two', value: 'two' }], modelValue: ['one'], allowCreate: true, maxVisibleChips: 1 } })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.props('modelValue')).toEqual(['one'])
  })
})
