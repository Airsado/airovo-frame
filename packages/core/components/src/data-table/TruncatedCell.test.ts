// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import TruncatedCell from './TruncatedCell.vue'

describe('TruncatedCell', () => {
    it('renders text and a tooltip trigger when content exists', () => {
        const wrapper = mount(TruncatedCell, { props: { text: 'a very long value' } })
        expect(wrapper.text()).toContain('a very long value')
        expect(wrapper.find('[data-slot="tooltip-trigger"]').exists()).toBe(true)
        expect(wrapper.find('[tabindex]').exists()).toBe(false)
    })

    it('does not create an empty tooltip', () => {
        const wrapper = mount(TruncatedCell, { props: { text: '' } })
        expect(wrapper.find('[data-slot="tooltip-trigger"]').exists()).toBe(false)
        expect(wrapper.find('[tabindex]').exists()).toBe(false)
    })

    it('keeps the explicit keyboard entry opt-in', () => {
        const wrapper = mount(TruncatedCell, { props: { text: 'keyboard value', tabIndex: 0 } })
        expect(wrapper.find('[tabindex="0"]').exists()).toBe(true)
    })

    it('keeps custom content and tooltip classes available to callers', () => {
        const wrapper = mount(TruncatedCell, {
            props: { text: 'display', tooltipContent: 'full value', contentClass: 'content-style', tooltipClass: 'tooltip-style' },
        })
        expect(wrapper.find('.content-style').text()).toBe('display')
    })

    it('accepts new-api class name aliases for cell, content and tooltip surfaces', () => {
        const wrapper = mount(TruncatedCell, {
            props: { text: 'display', cellClassName: 'cell-style', contentClassName: 'content-alias', tooltipClassName: 'tooltip-alias' },
        })
        expect(wrapper.find('.cell-style').exists()).toBe(true)
        expect(wrapper.find('.content-alias').text()).toBe('display')
        expect(wrapper.exists()).toBe(true)
    })

    it('creates a tooltip trigger from custom slot text when text is omitted', () => {
        const wrapper = mount(TruncatedCell, {
            slots: { default: () => [h('span', 'first'), h('strong', ' second')] },
        })
        expect(wrapper.find('[data-slot="tooltip-trigger"]').exists()).toBe(true)
        expect(wrapper.text()).toContain('first')
        expect(wrapper.text()).toContain('second')
    })
})
