// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TruncatedCell from './TruncatedCell.vue'

describe('TruncatedCell', () => {
    it('renders text and a tooltip trigger when content exists', () => {
        const wrapper = mount(TruncatedCell, { props: { text: 'a very long value' } })
        expect(wrapper.text()).toContain('a very long value')
        expect(wrapper.find('[data-slot="tooltip-trigger"]').exists()).toBe(true)
        expect(wrapper.find('[tabindex="0"]').exists()).toBe(true)
    })

    it('does not create an empty tooltip', () => {
        const wrapper = mount(TruncatedCell, { props: { text: '' } })
        expect(wrapper.find('[data-slot="tooltip-trigger"]').exists()).toBe(false)
        expect(wrapper.find('[tabindex="0"]').exists()).toBe(true)
    })

    it('keeps custom content and tooltip classes available to callers', () => {
        const wrapper = mount(TruncatedCell, {
            props: { text: 'display', tooltipContent: 'full value', contentClass: 'content-style', tooltipClass: 'tooltip-style' },
        })
        expect(wrapper.find('.content-style').text()).toBe('display')
    })
})
