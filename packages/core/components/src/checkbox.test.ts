// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Checkbox } from '@airovo/uikit-shadcnui'

describe('Checkbox public export', () => {
    it('renders public checkbox semantics and disabled state', () => {
        const wrapper = mount(Checkbox, { props: { modelValue: true, disabled: true, 'aria-label': '同意' } })
        expect(wrapper.attributes('data-slot')).toBe('checkbox')
        expect(wrapper.attributes('aria-label')).toBe('同意')
        expect(wrapper.attributes('disabled')).toBeDefined()
    })
})
