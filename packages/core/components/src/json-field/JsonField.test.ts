// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import JsonField from './JsonField.vue'

const global = { plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { jsonKey: '键', jsonValue: '值', jsonKeyPlaceholder: '字段名', jsonValuePlaceholder: '字段值', jsonEmptyFields: '暂无字段，点击下方按钮添加。', jsonMode: 'JSON 模式', visualMode: '可视化模式', fillTemplate: '回填模板', format: '格式化', deleteField: '删除字段', addField: '添加字段' } } } })] }

describe('JsonField', () => {
    it('fills a template and exposes visual editing updates', async () => {
        const wrapper = mount(JsonField, { global, props: { modelValue: '', template: { endpoint: '/v1', timeout: 30 } } })
        await wrapper.findAll('button').find(button => button.text() === '回填模板')?.trigger('click')
        expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toContain('endpoint')
        expect(wrapper.findAll('input')).toHaveLength(4)
        await wrapper.findAll('input')[1]!.setValue('/v2')
        expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toContain('/v2')
    })

    it('keeps invalid raw JSON visible and emits a parse error', async () => {
        const wrapper = mount(JsonField, { global, props: { modelValue: '{"ok":true}' } })
        await wrapper.findAll('button')[0]!.trigger('click')
        const textarea = wrapper.get('textarea')
        await textarea.setValue('{"ok":}')
        expect(wrapper.text()).toContain('JSON 格式无效')
        expect(wrapper.emitted('parse-error')?.at(-1)?.[0]).toBeTruthy()
    })

    it('shows nested paths in visual mode when nested is enabled', () => {
        const wrapper = mount(JsonField, { global, props: { modelValue: '{"server":{"host":"localhost"}}', nested: true } })
        expect(wrapper.findAll('input').map((input) => (input.element as HTMLInputElement).value)).toContain('server.host')
    })
})
