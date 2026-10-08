import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import DateTimePicker from './date-picker/DateTimePicker.vue'
import SelectBox from './select/SelectBox.vue'

let wrapper: VueWrapper | undefined
afterEach(() => { wrapper?.unmount() })

describe('disabled clear controls', () => {
    const cases = [
        { component: DateTimePicker, label: '清除日期时间', value: new Date(2026, 9, 8, 9) },
        { component: SelectBox, label: '清除选择', value: 'a' },
    ]
    it.each(cases)('$label follows disabled changes without emitting a clear', async ({ component, label, value }) => {
        wrapper = mount(component, {
            props: { modelValue: value, disabled: false, allowClear: true, options: [{ value: 'a', label: 'A' }] },
            attachTo: document.body,
        })
        const clear = wrapper.get<HTMLButtonElement>(`button[aria-label="${label}"]`)
        expect(clear.element.disabled).toBe(false)
        await wrapper.setProps({ disabled: true })
        expect(clear.element.disabled).toBe(true)
        clear.element.click()
        await flushPromises()
        expect(wrapper.emitted('update:modelValue')).toBeUndefined()
        // Also protect the handler when a stale/synthetic event bypasses native disabled behavior.
        await clear.trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeUndefined()
        await wrapper.setProps({ disabled: false })
        expect(clear.element.disabled).toBe(false)
        clear.element.click()
        await flushPromises()
        expect(wrapper.emitted('update:modelValue')).toEqual([[undefined]])
    })

    it('does not add SelectBox clear controls for empty values or allowClear=false', async () => {
        wrapper = mount(SelectBox, { props: { modelValue: 'a', allowClear: false } })
        expect(wrapper.find('[aria-label="清除选择"]').exists()).toBe(false)
        await wrapper.setProps({ modelValue: undefined, allowClear: true })
        expect(wrapper.find('[aria-label="清除选择"]').exists()).toBe(false)
    })

    it('does not add a DateTimePicker clear control for an empty value', () => {
        wrapper = mount(DateTimePicker)
        expect(wrapper.find('[aria-label="清除日期时间"]').exists()).toBe(false)
    })
})
