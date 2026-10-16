// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import JsonCodeEditor from './JsonCodeEditor.vue'

vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const global = { plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { copiedJson: '已复制 JSON', copyFailed: '复制失败' } } } })] }

describe('JsonCodeEditor', () => {
    it('renders status, line numbers and formatting control', async () => {
        const wrapper = mount(JsonCodeEditor, { global, props: { modelValue: '{"a":1}' } })
        expect(wrapper.text()).toContain('JSON')
        expect(wrapper.text()).toContain('1:1')
        expect(wrapper.text()).toContain('1')
        await wrapper.findAll('button').find(button => button.text() === '格式化')?.trigger('click')
        expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toContain('"a": 1')
    })

    it('keeps invalid drafts and reports parse errors', async () => {
        const wrapper = mount(JsonCodeEditor, { global, props: { modelValue: '{"a":1}' } })
        await wrapper.get('textarea').setValue('{"a":}')
        expect(wrapper.text()).toContain('JSON 格式无效')
        expect(wrapper.emitted('parse-error')?.at(-1)?.[0]).toBeTruthy()
    })

    it('forwards form and accessible attributes to the textarea', () => {
        const wrapper = mount(JsonCodeEditor, {
            global,
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
        expect(textarea.attributes('aria-invalid')).toBeUndefined()
        expect(wrapper.attributes('data-form-root')).toBe('settings-form')
    })

    it('exposes the inner textarea and honors an explicit aria-invalid state', () => {
        const elements: (HTMLTextAreaElement | null)[] = []
        const wrapper = mount(JsonCodeEditor, {
            global,
            props: {
                modelValue: '{"a":1}',
                ariaInvalid: true,
                heightClassName: 'h-80',
                textareaRef: (element) => elements.push(element),
            },
        })
        expect(wrapper.get('textarea').attributes('aria-invalid')).toBe('true')
        expect(wrapper.find('.h-80').exists()).toBe(true)
        expect(elements[0]).toBeInstanceOf(HTMLTextAreaElement)
        wrapper.unmount()
        expect(elements.at(-1)).toBeNull()
    })

    it('keeps the header actions at new-api spacing and reports clipboard success', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
        const wrapper = mount(JsonCodeEditor, { global, props: { modelValue: '{"a":1}' } })
        expect(wrapper.findAll('.gap-2').length).toBeGreaterThan(0)
        await wrapper.findAll('button').find(button => button.text() === '复制')?.trigger('click')
        expect(writeText).toHaveBeenCalledWith('{"a":1}')
        expect(toast.success).toHaveBeenCalledWith('已复制 JSON')
    })

    it('reports clipboard failure and keeps the draft when copying fails', async () => {
        const writeText = vi.fn().mockRejectedValue(new Error('clipboard denied'))
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
        const wrapper = mount(JsonCodeEditor, { global, props: { modelValue: '{"a":1}' } })
        await wrapper.findAll('button').find(button => button.text() === '复制')?.trigger('click')
        expect(toast.error).toHaveBeenCalledWith('复制失败')
        expect(wrapper.get('textarea').element.value).toBe('{"a":1}')
    })

    it('keeps the line-number layer aligned with textarea scrolling and cleans up the listener', async () => {
        const value = Array.from({ length: 12 }, (_, index) => `{"line":${index}}`).join('\n')
        const wrapper = mount(JsonCodeEditor, { global, props: { modelValue: value } })
        const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
        const removeEventListener = vi.spyOn(textarea, 'removeEventListener')
        textarea.scrollTop = 48
        textarea.dispatchEvent(new Event('scroll'))
        await wrapper.vm.$nextTick()

        expect(wrapper.get('.json-code-editor-line-numbers').attributes('style')).toContain('translateY(-48px)')
        wrapper.unmount()
        expect(removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
    })
})
