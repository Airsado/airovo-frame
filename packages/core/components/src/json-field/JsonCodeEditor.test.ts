// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import JsonCodeEditor from './JsonCodeEditor.vue'

vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('JsonCodeEditor', () => {
    it('renders status, line numbers and formatting control', async () => {
        const wrapper = mount(JsonCodeEditor, { props: { modelValue: '{"a":1}' } })
        expect(wrapper.text()).toContain('JSON')
        expect(wrapper.text()).toContain('1:1')
        expect(wrapper.text()).toContain('1')
        await wrapper.findAll('button').find(button => button.text() === '格式化')?.trigger('click')
        expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toContain('"a": 1')
    })

    it('keeps invalid drafts and reports parse errors', async () => {
        const wrapper = mount(JsonCodeEditor, { props: { modelValue: '{"a":1}' } })
        await wrapper.get('textarea').setValue('{"a":}')
        expect(wrapper.text()).toContain('JSON 格式无效')
        expect(wrapper.emitted('parse-error')?.at(-1)?.[0]).toBeTruthy()
    })

    it('forwards form and accessible attributes to the textarea', () => {
        const wrapper = mount(JsonCodeEditor, {
            props: {
                modelValue: '{"a":1}',
                id: 'json-config',
                name: 'config',
                ariaDescribedby: 'config-help',
                dataFormRoot: 'settings-form',
            },
        })
        const textarea = wrapper.get('textarea')

        expect(textarea.attributes('id')).toBe('json-config')
        expect(textarea.attributes('name')).toBe('config')
        expect(textarea.attributes('aria-describedby')).toBe('config-help')
        expect(textarea.attributes('data-form-root')).toBe('settings-form')
        expect(textarea.attributes('aria-invalid')).toBe('false')
    })

    it('keeps the header actions at new-api spacing and reports clipboard success', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
        const wrapper = mount(JsonCodeEditor, { props: { modelValue: '{"a":1}' } })
        expect(wrapper.findAll('.gap-2').length).toBeGreaterThan(0)
        await wrapper.findAll('button').find(button => button.text() === '复制')?.trigger('click')
        expect(writeText).toHaveBeenCalledWith('{"a":1}')
    })
})
