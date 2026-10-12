// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import JsonCodeEditor from './JsonCodeEditor.vue'

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
})
