// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PasswordInput from './PasswordInput.vue'

describe('PasswordInput new-api surface', () => {
    it('keeps the input masked by default and toggles visibility without changing the value', async () => {
        const wrapper = mount(PasswordInput, {
            props: { modelValue: 'secret' },
            attrs: { type: 'text', name: 'password', autocomplete: 'current-password' },
        })

        const input = wrapper.get('input')
        const toggle = wrapper.get('button')
        expect(input.attributes('type')).toBe('password')
        expect(input.attributes('name')).toBe('password')
        expect(input.attributes('autocomplete')).toBe('current-password')
        expect(input.element.value).toBe('secret')
        expect(toggle.attributes('aria-label')).toBe('Toggle password visibility')
        expect(toggle.find('svg').attributes('aria-hidden')).toBe('true')

        await toggle.trigger('click')

        expect(input.attributes('type')).toBe('text')
        expect(input.element.value).toBe('secret')
        expect(toggle.find('svg').attributes('aria-hidden')).toBe('true')
    })

    it('forwards model updates and separates wrapper and input classes', async () => {
        const wrapper = mount(PasswordInput, {
            props: {
                modelValue: 'initial',
                class: 'w-64',
                inputClass: 'font-mono',
                toggleAriaLabel: '显示或隐藏密码',
            },
            attrs: { 'aria-describedby': 'password-help', 'data-test': 'password-input' },
        })

        await wrapper.get('input').setValue('changed')

        expect(wrapper.classes()).toEqual(expect.arrayContaining(['relative', 'rounded-md', 'w-64']))
        expect(wrapper.get('input').classes()).toContain('font-mono')
        expect(wrapper.get('input').attributes('aria-describedby')).toBe('password-help')
        expect(wrapper.get('input').attributes('data-test')).toBe('password-input')
        expect(wrapper.get('button').attributes('aria-label')).toBe('显示或隐藏密码')
        expect(wrapper.emitted('update:modelValue')).toContainEqual(['changed'])
    })

    it('disables both the native input and visibility toggle', async () => {
        const wrapper = mount(PasswordInput, {
            props: { modelValue: 'secret', disabled: true },
        })

        const input = wrapper.get('input')
        const toggle = wrapper.get('button')
        expect(input.element.disabled).toBe(true)
        expect(toggle.element.disabled).toBe(true)

        await toggle.trigger('click')

        expect(input.attributes('type')).toBe('password')
    })
})
