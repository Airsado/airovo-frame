// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PageFooter from './PageFooter.vue'

describe('PageFooter', () => {
    it('renders content and actions with stable semantic attributes', () => {
        const wrapper = mount(PageFooter, { props: { compact: true, sticky: true }, slots: { default: '状态', actions: '保存' } })
        expect(wrapper.attributes('role')).toBe('contentinfo')
        expect(wrapper.attributes('data-slot')).toBe('page-footer')
        expect(wrapper.classes()).toContain('sticky')
        expect(wrapper.text()).toContain('状态')
        expect(wrapper.text()).toContain('保存')
    })
})
