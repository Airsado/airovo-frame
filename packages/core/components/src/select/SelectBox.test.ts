// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import SelectBox from './SelectBox.vue'

const stubs = {
    Select: { template: '<div><slot /></div>' },
    SelectTrigger: { template: '<button v-bind="$attrs"><slot /></button>' },
    SelectValue: { props: ['placeholder'], template: '<span>{{ placeholder }}</span>' },
    SelectContent: { template: '<div v-bind="$attrs" data-select-content><slot /></div>' },
    SelectGroup: { template: '<div><slot /></div>' },
    SelectLabel: { template: '<div v-bind="$attrs" data-select-label><slot /></div>' },
    SelectItem: { template: '<div v-bind="$attrs" data-select-item><slot /></div>' },
    X: true,
}

const global = {
    stubs,
    plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { selectPlaceholder: '请选择', clearSelection: '清除选择' } } } })],
}

describe('SelectBox new-api surface', () => {
    it('uses compact trigger and popup density while preserving hierarchy', () => {
        const wrapper = mount(SelectBox, {
            global,
            props: {
                options: [{ label: '云服务', children: [{ label: 'OpenAI', value: 'openai' }] }],
            },
        })
        expect(wrapper.get('button').classes()).toEqual(expect.arrayContaining(['h-8', 'rounded-lg', 'px-2.5', 'py-2']))
        expect(wrapper.get('[data-select-content]').classes()).toEqual(expect.arrayContaining(['w-(--reka-select-trigger-width)', 'rounded-lg', 'ring-1']))
        expect(wrapper.get('[data-select-label]').classes()).toEqual(expect.arrayContaining(['px-1.5', 'py-1', 'font-medium']))
        expect(wrapper.get('[data-select-item]').classes()).toEqual(expect.arrayContaining(['rounded-md', 'py-1', 'pl-1.5']))
    })
})
