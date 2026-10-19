// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DrawerContent from './DrawerContent.vue'

const stubs = {
    DialogPortal: { template: '<div data-slot="drawer-portal"><slot /></div>' },
    DialogContent: {
        inheritAttrs: false,
        template: '<div data-slot="drawer-content" v-bind="$attrs"><slot /></div>',
    },
    DrawerOverlay: { template: '<div data-slot="drawer-overlay" />' },
}

describe('DrawerContent', () => {
    it('keeps the right drawer responsive and bounded on larger screens', () => {
        const wrapper = mount(DrawerContent, {
            props: { side: 'right' },
            global: { stubs },
        })

        const content = wrapper.get('[data-slot="drawer-content"]')
        expect(content.classes()).toContain('w-full')
        expect(content.classes()).toContain('sm:max-w-md')
        expect(content.classes()).toContain('h-dvh')
    })

    it('leaves top breathing room for the bottom drawer while preserving its max height', () => {
        const wrapper = mount(DrawerContent, {
            props: { side: 'bottom' },
            global: { stubs },
        })

        const content = wrapper.get('[data-slot="drawer-content"]')
        expect(content.classes()).toContain('mt-24')
        expect(content.classes()).toContain('max-h-[80dvh]')
    })
})
