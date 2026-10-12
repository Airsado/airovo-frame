// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import JsonField from './JsonField.vue'

describe('JsonField', () => {
    it('fills a template and exposes visual editing updates', async () => {
        const wrapper = mount(JsonField, { props: { modelValue: '', template: { endpoint: '/v1', timeout: 30 } } })
        await wrapper.findAll('button').find(button => button.text() === '回填模板')?.trigger('click')
        expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toContain('endpoint')
        expect(wrapper.findAll('input')).toHaveLength(4)
        await wrapper.findAll('input')[1]!.setValue('/v2')
        expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toContain('/v2')
    })

    it('keeps invalid raw JSON visible and emits a parse error', async () => {
        const wrapper = mount(JsonField, { props: { modelValue: '{"ok":true}' } })
        await wrapper.findAll('button')[0]!.trigger('click')
        const textarea = wrapper.get('textarea')
        await textarea.setValue('{"ok":}')
        expect(wrapper.text()).toContain('JSON 格式无效')
        expect(wrapper.emitted('parse-error')?.at(-1)?.[0]).toBeTruthy()
    })
})
