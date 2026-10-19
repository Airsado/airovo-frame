// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { Checkbox } from './checkbox'

describe('Checkbox public export', () => {
    it('renders public checkbox semantics and disabled state', () => {
        const wrapper = mount(Checkbox, { props: { modelValue: true, disabled: true, 'aria-label': '同意' } })
        expect(wrapper.attributes('data-slot')).toBe('checkbox')
        expect(wrapper.attributes('aria-label')).toBe('同意')
        expect(wrapper.attributes('disabled')).toBeDefined()
    })

    it('forwards each primitive click once and updates a controlled permission selection', async () => {
        const selected = ref<string[]>([])
        const updates: Array<boolean | 'indeterminate'> = []
        const wrapper = mount(defineComponent({
            setup: () => () => h('label', [
                h(Checkbox, {
                    modelValue: selected.value.includes('video:read'),
                    'aria-label': '查看视频',
                    'onUpdate:modelValue': (checked: boolean | 'indeterminate') => {
                        updates.push(checked)
                        selected.value = checked === true ? ['video:read'] : []
                    },
                }),
                '查看视频',
            ]),
        }))
        const checkbox = wrapper.get('[role="checkbox"]')
        await checkbox.trigger('click')
        expect(selected.value).toEqual(['video:read'])
        expect(checkbox.attributes('aria-checked')).toBe('true')
        await checkbox.trigger('click')
        expect(selected.value).toEqual([])
        expect(updates).toEqual([true, false])
    })

    it('supports uncontrolled changes and the indeterminate-to-checked transition', async () => {
        const wrapper = mount(Checkbox, { props: { defaultValue: 'indeterminate' } })
        expect(wrapper.attributes('aria-checked')).toBe('mixed')
        expect(wrapper.find('[data-slot="checkbox-indicator"] svg').exists()).toBe(true)
        await wrapper.trigger('click')
        expect(wrapper.attributes('aria-checked')).toBe('true')
        await wrapper.trigger('click')
        expect(wrapper.attributes('aria-checked')).toBe('false')
        expect(wrapper.emitted('update:modelValue')).toEqual([[true], [false]])
    })

    it('retains native Space activation and prevents Enter form submission', async () => {
        const wrapper = mount(Checkbox)
        expect(wrapper.element.tagName).toBe('BUTTON')
        expect(wrapper.attributes('type')).toBe('button')
        const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
        wrapper.element.dispatchEvent(enter)
        expect(enter.defaultPrevented).toBe(true)
        const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
        wrapper.element.dispatchEvent(space)
        expect(space.defaultPrevented).toBe(false)
        expect(wrapper.emitted('update:modelValue')).toBeUndefined()
        // DOM test environments do not synthesize native button activation.
        // The browser's Space-generated click must enter this same one path.
        await wrapper.trigger('click', { detail: 0 })
        expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    })

    it('does not activate when disabled', async () => {
        const wrapper = mount(Checkbox, { props: { disabled: true } })
        ;(wrapper.element as HTMLButtonElement).click()
        expect(wrapper.emitted('update:modelValue')).toBeUndefined()
        expect(wrapper.attributes('aria-checked')).toBe('false')
    })
})
