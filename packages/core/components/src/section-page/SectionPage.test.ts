// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import SectionPage from './SectionPage.vue'
import PageFooter from './PageFooter.vue'
import PageFooterPortal from './PageFooterPortal.vue'

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
        expect(header.classes()).not.toContain('border-b')
        const defaultWrapper = mount(SectionPage, {
            global: {
                plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { untitledPage: '未命名页面' } } } })],
            },
        })
        expect(defaultWrapper.get('h1').classes()).toContain('font-bold')
    })

    it('keeps optional tabs inside the sticky header without adding a content offset', () => {
        const wrapper = mount(SectionPage, {
            slots: {
                title: '<h1>渠道</h1>',
                tabs: '<div data-test="tabs">概览 / 活动</div>',
                default: '<div data-test="content" class="h-[1200px]">内容</div>',
            },
            global: {
                plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { untitledPage: '未命名页面' } } } })],
            },
        })
        const header = wrapper.get('[data-slot="section-page-header"]')
        expect(header.get('[data-slot="section-page-tabs"]').classes()).toEqual(expect.arrayContaining(['mt-3', 'min-w-0', 'sm:mt-4']))
        expect(header.get('[data-test="tabs"]').text()).toContain('概览')
        expect(wrapper.get('[data-test="content"]').element.closest('[data-slot="section-page-header"]')).toBeNull()
    })

    it('keeps fixed content mode on the independent content scroll layer', () => {
        const wrapper = mount(SectionPage, {
            props: { fixedContent: true },
            slots: { default: '<div>固定区域</div>' },
            global: {
                plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { untitledPage: '未命名页面' } } } })],
            },
        })
        const content = wrapper.get('[data-slot="section-page-header"]').element.nextElementSibling as HTMLElement
        expect(content.className).toContain('overflow-hidden')
        expect(content.className).not.toContain('overflow-auto')
    })

    it('teleports PageFooterPortal into the SectionPage footer host', async () => {
        const wrapper = mount(SectionPage, {
            slots: {
                default: () => h(PageFooterPortal, {}, { default: () => h(PageFooter, {}, { default: () => '状态' }) }),
            },
            attachTo: document.body,
            global: {
                plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { untitledPage: '未命名页面' } } } })],
            },
        })
        await nextTick()
        await nextTick()
        expect(wrapper.get('[data-slot="section-page-footer-host"]').find('[data-slot="page-footer"]').text()).toContain('状态')
        wrapper.unmount()
    })

    it('does not render a footer portal outside SectionPage', () => {
        const wrapper = mount(PageFooterPortal, { slots: { default: '孤儿 footer' }, attachTo: document.body })
        expect(document.body.textContent).not.toContain('孤儿 footer')
        wrapper.unmount()
    })
})
