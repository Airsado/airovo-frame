// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Combobox from './Combobox.vue'

const stubs = {
    Popover: { template: '<div><slot /></div>' },
    PopoverTrigger: { template: '<div><slot /></div>' },
    PopoverContent: { template: '<div><slot /></div>' },
    Command: { template: '<div><slot /></div>' },
    CommandInput: { emits: ['keydown'], template: '<input data-slot="command-input" @keydown="$emit(\'keydown\', $event)" />' },
    CommandList: { template: '<div><slot /></div>' },
    CommandEmpty: { template: '<div><slot /></div>' },
    CommandGroup: { template: '<div><slot /></div>' },
    CommandItem: { template: '<button :disabled="disabled" @click="$emit(\'select\')"><slot /></button>', props: ['disabled'], emits: ['select'] },
}

describe('Combobox', () => {
    it('renders a combobox trigger with disabled option support', () => {
        const wrapper = mount(Combobox, { props: { options: [{ label: 'OpenAI', value: 'openai', disabled: true }] } })
        expect(wrapper.get('[role="combobox"]').attributes('aria-expanded')).toBe('false')
        expect(wrapper.get('[role="combobox"]').element.disabled).toBe(false)
    })

    it('accepts a custom value on Enter when enabled', async () => {
        const wrapper = mount(Combobox, { props: { allowCustomValue: true, options: [] }, global: { stubs } })
        await wrapper.get('[role="combobox"]').trigger('click')
        const input = wrapper.find('[data-slot="command-input"]')
        await input.setValue('custom-model')
        await input.trigger('keydown', { key: 'Enter' })
        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['custom-model'])
    })
})
