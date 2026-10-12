// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { AForm, useForm, type FormApi, type FormFieldSchema } from './index'

let wrapper: VueWrapper | undefined
afterEach(() => { wrapper?.unmount(); wrapper = undefined })

const cases: Array<{ name: string; schema: FormFieldSchema[]; path: string; initialValues?: Record<string, unknown> }> = [
    { name: 'ordinary', schema: [{ fieldName: 'name', label: 'Name', component: 'Input', rules: 'required' }], path: 'name[0].value' },
    { name: 'array', schema: [{ fieldName: 'name', label: 'Names', component: 'Input', rules: 'required', array: true }], path: 'name[0].value' },
    { name: 'nested object', schema: [{ fieldName: 'profile', label: 'Profile', component: 'Input', children: [{ fieldName: 'name', label: 'Name', component: 'Input', rules: 'required' }] }], path: 'profile[0].name' },
    { name: 'nested array', schema: [{ fieldName: 'profile', label: 'Profile', component: 'Input', children: [{ fieldName: 'name', label: 'Names', component: 'Input', rules: 'required', array: true }] }], path: 'profile[0].name[0].value' },
    { name: 'dotted path', schema: [{ fieldName: 'profile.name', label: 'Name', component: 'Input', rules: 'required' }], path: 'profile.name[0].value' },
    { name: 'second array row', schema: [{ fieldName: 'name', label: 'Names', component: 'Input', rules: 'required', array: true }], path: 'name[1].value', initialValues: { name: [{ value: 'Valid' }, { value: '' }] } },
    { name: 'second nested array row', schema: [{ fieldName: 'profile', label: 'Profile', component: 'Input', children: [{ fieldName: 'name', label: 'Names', component: 'Input', rules: 'required', array: true }] }], path: 'profile[0].name[1].value', initialValues: { profile: [{ name: [{ value: 'Valid' }, { value: '' }] }] } },
]

describe('form DOM ownership', () => {
    it('binds a custom component object through the FormFieldSchema contract', async () => {
        let api!: FormApi
        const JsonLikeField = defineComponent({
            props: { modelValue: { type: String, default: '' }, disabled: Boolean },
            emits: ['update:modelValue'],
            setup(props, { emit }) {
                return () => h('input', {
                    value: props.modelValue,
                    disabled: props.disabled,
                    onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
                })
            },
        })
        const Host = defineComponent({ setup() {
            const [Form, formApi] = useForm({
                schema: [{ fieldName: 'json', label: 'JSON', component: JsonLikeField, defaultValue: '{"ready":true}' }],
            })
            api = formApi
            return () => h(Form)
        } })
        wrapper = mount(Host)
        await flushPromises()
        const input = wrapper.get<HTMLInputElement>('input')
        expect(input.element.value).toBe('{"ready":true}')
        await input.setValue('{"changed":true}')
        expect((api.values.value.json as Array<{ value: string }>)[0]?.value).toBe('{"changed":true}')
        api.setProps({ disabled: true })
        await nextTick()
        expect(input.element.disabled).toBe(true)
        api.resetFields(['json'])
        await nextTick()
        expect(input.element.value).toBe('{"ready":true}')
    })

    it.each(cases)('isolates $name IDs and failed-field focus for tuple and direct renderers', async ({ schema, path, initialValues }) => {
        let first!: FormApi, second!: FormApi
        const Host = defineComponent({ setup() {
            const [First, firstApi] = useForm({ schema, initialValues })
            const [, secondApi] = useForm({ schema, initialValues })
            first = firstApi; second = secondApi
            return () => h('main', [h(First, { 'data-form': 'first' }), h(AForm, { api: second, 'data-form': 'second' })])
        } })
        wrapper = mount(Host, { attachTo: document.body })
        await flushPromises()
        const firstInput = wrapper.get<HTMLInputElement>(`[data-form=first] input[name="${path}"]`)
        const secondInput = wrapper.get<HTMLInputElement>(`[data-form=second] input[name="${path}"]`)
        expect(firstInput.attributes('name')).toBe(path)
        expect(secondInput.attributes('name')).toBe(path)
        const focus = second.scrollToField.bind(second)
        const focusSpy = vi.spyOn(second, 'scrollToField').mockImplementation((name) => {
            expect(second.loading).toBe(false)
            expect(secondInput.element.closest('fieldset')?.disabled).toBe(false)
            focus(name)
        })
        await second.submitForm()
        await flushPromises()
        expect(second.errors.value[path]).toBeTruthy()
        expect(first.errors.value).toEqual({})
        expect(document.activeElement).toBe(secondInput.element)
        expect(focusSpy).toHaveBeenCalledWith(path)
        expect(firstInput.attributes('id')).not.toBe(secondInput.attributes('id'))
        const ids = wrapper.findAll('[id]').map((node) => node.attributes('id'))
        expect(new Set(ids).size).toBe(ids.length)
        for (const form of wrapper.findAll('form')) {
            for (const label of form.findAll<HTMLLabelElement>('label[for]')) {
                expect(label.element.control?.closest('form')).toBe(form.element)
            }
        }
        const labelledBy = secondInput.attributes('aria-labelledby')
        if (labelledBy) expect(document.getElementById(labelledBy)?.closest('form')).toBe(secondInput.element.closest('form'))
        expect(secondInput.attributes('aria-invalid')).toBe('true')
        await first.submitForm()
        expect(document.activeElement).toBe(firstInput.element)
        // Detaching one renderer cannot leave a global lookup that focuses the other form.
        first.scrollToField('does-not-exist')
        expect(document.activeElement).toBe(firstInput.element)
    })

    it('drops detached roots and preserves session values on renderer reopen', async () => {
        let first!: FormApi, second!: FormApi
        const show = ref(true)
        const Host = defineComponent({ setup() {
            const [First, firstApi] = useForm({ schema: cases[0].schema })
            const [Second, secondApi] = useForm({ schema: cases[0].schema })
            first = firstApi; second = secondApi
            return () => h('main', [h(First), show.value ? h(Second) : null])
        } })
        wrapper = mount(Host, { attachTo: document.body })
        await flushPromises()
        const initialId = wrapper.findAll('input')[1].attributes('id')
        show.value = false
        await nextTick()
        first.scrollToField('name[0].value')
        const focused = document.activeElement
        second.scrollToField('name[0].value')
        expect(document.activeElement).toBe(focused)
        await second.setValues({ name: [{ value: 'Restored' }] })
        show.value = true
        await flushPromises()
        const reopened = wrapper.findAll<HTMLInputElement>('input')[1]
        expect(reopened.element.value).toBe('Restored')
        expect(reopened.attributes('id')).not.toBe(initialId)
        second.scrollToField('name[0].value')
        expect(document.activeElement).toBe(reopened.element)
    })
})
