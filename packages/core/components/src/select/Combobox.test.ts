// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Combobox from './Combobox.vue'

const stubs = {
    Popover: { template: '<div><slot /></div>' },
    PopoverTrigger: { template: '<div><slot /></div>' },
    PopoverContent: { template: '<div><slot /></div>' },
    Command: { template: '<div><slot /></div>' },
    CommandInput: { emits: ['keydown', 'update:modelValue'], props: ['modelValue'], template: '<input data-slot="command-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown="$emit(\'keydown\', $event)" />' },
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

    it('renders only selectable leaf options when groups are provided', () => {
        const wrapper = mount(Combobox, {
            props: {
                options: [{ label: 'Cloud', children: [{ label: 'OpenAI', value: 'openai' }] }],
            },
            global: { stubs },
        })

        expect(wrapper.findAll('button')).toHaveLength(2)
        expect(wrapper.text()).toContain('OpenAI')
        expect(wrapper.text()).not.toContain('Cloud')
    })

    it('searches labels and values, renders descriptions/icons, and restores selection on Escape', async () => {
        const wrapper = mount(Combobox, {
            props: {
                modelValue: 'openai',
                options: [
                    { label: 'OpenAI', value: 'openai', icon: 'lucide:cloud' },
                    { label: 'Google', value: 'gemini', description: '备用渠道', icon: 'lucide:cloud' },
                ],
                showSelectedIcon: true,
                ariaLabel: '提供商',
                id: 'provider',
                name: 'provider',
            },
            global: { stubs },
        })

        expect(wrapper.get('[role="combobox"]').attributes('aria-label')).toBe('提供商')
        expect(wrapper.get('[role="combobox"]').attributes('id')).toBe('provider')
        expect(wrapper.get('[data-slot="combobox-selected-icon"]')).toBeTruthy()
        await wrapper.get('[role="combobox"]').trigger('click')
        const input = wrapper.get('[data-slot="command-input"]')
        await input.setValue('gemini')
        expect(wrapper.text()).toContain('Google')
        expect(wrapper.text()).toContain('备用渠道')
        expect(wrapper.findAll('button').filter((button) => !button.attributes('role')).map((button) => button.text())).not.toContain('OpenAI')
        await input.trigger('keydown', { key: 'Escape' })
        expect(wrapper.get('[role="combobox"]').text()).toContain('OpenAI')
        expect(wrapper.get('[role="combobox"]').attributes('aria-expanded')).toBe('false')
    })

    it('does not open on focus by default and opens when requested', async () => {
        const closed = mount(Combobox, { props: { options: [{ label: 'A', value: 'a' }] }, global: { stubs } })
        await closed.get('[role="combobox"]').trigger('focus')
        expect(closed.get('[role="combobox"]').attributes('aria-expanded')).toBe('false')

        const open = mount(Combobox, { props: { openOnFocus: true, options: [{ label: 'A', value: 'a' }] }, global: { stubs } })
        await open.get('[role="combobox"]').trigger('focus')
        expect(open.get('[role="combobox"]').attributes('aria-expanded')).toBe('true')
    })
})
