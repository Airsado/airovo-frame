// @vitest-environment happy-dom
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FrameworkTooltip from './FrameworkTooltip.vue'

const TooltipStub = defineComponent({
    props: ['open', 'defaultOpen', 'disabled'],
    emits: ['update:open'],
    template: '<div data-tooltip-root :data-open="open === true ? \'true\' : open === false ? \'false\' : undefined" :data-default-open="defaultOpen === true ? \'true\' : undefined"><slot /></div>',
})

const stubs = {
    TooltipProvider: { template: '<div data-tooltip-provider><slot /></div>' },
    Tooltip: TooltipStub,
    TooltipTrigger: { inheritAttrs: false, props: ['disabled'], template: '<button data-tooltip-trigger :disabled="disabled" v-bind="$attrs"><slot /></button>' },
    TooltipContent: { template: '<div data-tooltip-content><slot /></div>' },
}

describe('FrameworkTooltip', () => {
    it('supports controlled and uncontrolled opening while preserving slots', async () => {
        const controlled = mount(FrameworkTooltip, {
            props: { open: true, defaultOpen: false, content: '提示' },
            slots: { trigger: '<span data-trigger>帮助</span>' },
            global: { stubs },
        })

        expect(controlled.get('[data-tooltip-root]').attributes('data-open')).toBe('true')
        expect(controlled.get('[data-tooltip-content]').text()).toBe('提示')
        expect(controlled.get('[data-trigger]').text()).toBe('帮助')

        controlled.findComponent(TooltipStub).vm.$emit('update:open', false)
        expect(controlled.emitted('update:open')).toEqual([[false]])

        const uncontrolled = mount(FrameworkTooltip, {
            props: { defaultOpen: true },
            global: { stubs },
        })
        expect(uncontrolled.get('[data-tooltip-root]').attributes('data-default-open')).toBe('true')
    })

    it('keeps disabled state on the root and trigger', () => {
        const wrapper = mount(FrameworkTooltip, {
            props: { disabled: true, delayDuration: 120 },
            global: { stubs },
        })
        expect(wrapper.get('[data-tooltip-trigger]').attributes('disabled')).toBeDefined()
        expect(wrapper.get('[data-tooltip-root]').attributes('data-open')).toBe('false')
    })
})
