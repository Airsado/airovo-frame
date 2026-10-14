// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import ResultPage from './ResultPage.vue'

describe('ResultPage', () => {
    it('uses locale defaults while explicit copy remains authoritative', () => {
        const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': { common: { result: { '404': { title: 'Page missing', description: 'Check the address', secondaryText: 'Home' } } } } } })
        const wrapper = mount(ResultPage, { global: { plugins: [i18n] }, props: { status: '404' } })
        expect(wrapper.get('h1').text()).toBe('Page missing')
        expect(wrapper.text()).toContain('Check the address')
        expect(wrapper.text()).toContain('Home')
        const explicit = mount(ResultPage, { global: { plugins: [i18n] }, props: { status: '404', title: 'Custom', description: 'Custom description', secondaryText: 'Back' } })
        expect(explicit.get('h1').text()).toBe('Custom')
        expect(explicit.text()).toContain('Custom description')
        expect(explicit.text()).toContain('Back')
    })
})
