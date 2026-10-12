// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import SectionPage from './SectionPage.vue'

describe('SectionPage', () => {
    it('keeps the title region in a sticky, layered header', () => {
        const wrapper = mount(SectionPage, {
            slots: {
                title: '<h1>渠道</h1>',
                default: '<div class="h-[1200px]">内容</div>',
            },
            global: {
                plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { untitledPage: '未命名页面' } } } })],
            },
        })

        const header = wrapper.get('[data-slot="section-page-header"]')
        expect(header.classes()).toContain('sticky')
        expect(header.classes()).toContain('top-0')
        expect(header.classes()).toContain('z-20')
        expect(header.classes()).toContain('bg-background/95')
    })
})
