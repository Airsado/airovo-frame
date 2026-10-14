// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import LiveLog from './LiveLog.vue'

describe('LiveLog', () => {
    it('uses locale defaults while explicit empty text remains authoritative', () => {
        const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': { common: { noLogs: 'No logs', followLatest: 'Follow latest' } } } })
        const wrapper = mount(LiveLog, { global: { plugins: [i18n] }, props: { items: [] } })
        expect(wrapper.text()).toContain('No logs')
        const explicit = mount(LiveLog, { global: { plugins: [i18n] }, props: { items: [], emptyText: 'Nothing here' } })
        expect(explicit.text()).toContain('Nothing here')
    })
})
