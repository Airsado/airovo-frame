// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { h, nextTick, defineComponent } from 'vue'
import { useForm, type FormApi, type FormFieldSchema } from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
})

function mountForm(schema: FormFieldSchema[]): FormApi {
    let api!: FormApi
    const Host = defineComponent({
        setup() {
            const [Form, formApi] = useForm({ schema, showDefaultActions: false })
            api = formApi
            return () => h(Form)
        },
    })
    wrapper = mount(Host)
    return api
}

describe('Password form field mapping', () => {
    it('uses PasswordInput for a top-level Password schema and owns its type', async () => {
        const api = mountForm([{
            fieldName: 'password',
            label: 'Password',
            component: 'Password',
            componentProps: { type: 'text', autocomplete: 'current-password' },
            rules: 'required',
        }])
        await flushPromises()

        const input = wrapper!.get('input')
        const toggle = wrapper!.get('button')
        expect(input.attributes('type')).toBe('password')
        expect(input.attributes('autocomplete')).toBe('current-password')
        expect(api.values.value.password).toEqual([{ value: '' }])

        await toggle.trigger('click')

        expect(input.attributes('type')).toBe('text')
        await input.setValue('changed')
        expect(api.values.value.password).toEqual([{ value: 'changed' }])
    })

    it('uses the same PasswordInput mapping for nested FormFieldNodes', async () => {
        const api = mountForm([{
            fieldName: 'account',
            label: 'Account',
            component: 'Input',
            children: [{
                fieldName: 'password',
                label: 'Password',
                component: 'Password',
                componentProps: { autocomplete: 'new-password' },
            }],
        }])
        await flushPromises()

        const input = wrapper!.get('input')
        const toggle = wrapper!.get('button')
        expect(input.attributes('type')).toBe('password')
        expect(input.attributes('autocomplete')).toBe('new-password')

        await toggle.trigger('click')
        expect(input.attributes('type')).toBe('text')

        api.setProps({ disabled: true })
        await nextTick()
        expect(input.element.disabled).toBe(true)
        expect(toggle.element.disabled).toBe(true)
    })
})
