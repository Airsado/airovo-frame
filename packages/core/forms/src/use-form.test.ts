// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { z } from 'zod'
import { isRequiredRule, useAForm, useForm, type FormApi, type FormFieldSchema } from './index'

let wrapper: VueWrapper | undefined

afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
})

async function mountForm(schema: FormFieldSchema[], options: Record<string, unknown> = {}) {
    let api!: FormApi
    const Host = defineComponent({
        setup() {
            const [Form, formApi] = useForm({ schema, ...options })
            api = formApi
            return () => h(Form)
        },
    })
    wrapper = mount(Host)
    await flushPromises()
    return { api, wrapper }
}

describe('useForm and AForm', () => {
    it('shares one controller, renders initial values, and submits validated values', async () => {
        const handleSubmit = vi.fn()
        const { api, wrapper } = await mountForm([
            { fieldName: 'username', label: 'User', component: 'Input', rules: 'required,min:3' },
        ], { initialValues: { username: [{ value: 'Ada' }] }, handleSubmit })

        const input = wrapper.find<HTMLInputElement>('input[name="username[0].value"]')
        expect((input.element as HTMLInputElement).value).toBe('Ada')
        await wrapper.find('form').trigger('submit')
        await vi.waitFor(() => expect(api.loading).toBe(false))
        expect(handleSubmit).toHaveBeenCalledOnce()
        expect(handleSubmit).toHaveBeenCalledWith({ username: [{ value: 'Ada' }] })
        expect(api.errors.value).toEqual({})
    })

    it('renders async validation errors through FormApi and blocks submission', async () => {
        const handleSubmit = vi.fn()
        const { api, wrapper } = await mountForm([
            {
                fieldName: 'username',
                label: 'User',
                component: 'Input',
                rules: z.string().refine(async (value) => value === 'allowed', 'Unavailable'),
            },
        ], { handleSubmit })

        const input = wrapper.find<HTMLInputElement>('input[name="username[0].value"]')
        await input.setValue('taken')
        await input.trigger('blur')
        await wrapper.find('form').trigger('submit')
        await vi.waitFor(() => expect(api.loading).toBe(false))
        expect(api.errors.value['username[0].value']).toBe('Unavailable')
        expect(wrapper.find('[data-slot="field-error"]').text()).toContain('Unavailable')
        expect(handleSubmit).not.toHaveBeenCalled()
    })

    it('validates a schema field by its public field name', async () => {
        const { api } = await mountForm([
            { fieldName: 'username', label: 'User', component: 'Input', rules: 'required' },
        ])

        await expect(api.validateField('username')).resolves.toEqual({ valid: false })
        expect(api.errors.value['username[0].value']).toBe('必填')
    })

    it('marks required labels and controls while leaving optional fields unmarked', async () => {
        const { wrapper } = await mountForm([
            { fieldName: 'requiredName', label: 'Required name', component: 'Input', rules: 'required' },
            { fieldName: 'optionalNote', label: 'Optional note', component: 'Textarea' },
            {
                fieldName: 'zodEmail',
                label: 'Required email',
                component: 'Email',
                rules: z.string().email(),
            },
            {
                fieldName: 'optionalEmail',
                label: 'Optional email',
                component: 'Email',
                rules: z.string().email().optional(),
            },
            {
                fieldName: 'requiredEmails',
                label: 'Required email list',
                component: 'Email',
                array: true,
                rules: 'required,email',
            },
        ])

        expect(isRequiredRule('required')).toBe(true)
        expect(isRequiredRule('required,email')).toBe(true)
        expect(isRequiredRule(undefined)).toBe(false)
        expect(isRequiredRule(z.string().email())).toBe(true)
        expect(isRequiredRule(z.string().email().optional())).toBe(false)

        const requiredLabel = wrapper.findAll('label').find(
            (label) => label.attributes('for') === 'AForm-requiredName',
        )
        const optionalLabel = wrapper.findAll('label').find(
            (label) => label.attributes('for') === 'AForm-optionalNote',
        )
        const zodRequiredLabel = wrapper.findAll('label').find(
            (label) => label.attributes('for') === 'AForm-zodEmail',
        )
        const zodOptionalLabel = wrapper.findAll('label').find(
            (label) => label.attributes('for') === 'AForm-optionalEmail',
        )

        expect(requiredLabel?.find('[data-slot="required-indicator"]').exists()).toBe(true)
        expect(requiredLabel?.find('[data-slot="required-indicator"]').attributes('title')).toBe('必填')
        expect(optionalLabel?.find('[data-slot="required-indicator"]').exists()).toBe(false)
        expect(zodRequiredLabel?.find('[data-slot="required-indicator"]').exists()).toBe(true)
        expect(zodOptionalLabel?.find('[data-slot="required-indicator"]').exists()).toBe(false)
        expect(wrapper.findAll('[data-slot="required-indicator"]')).toHaveLength(3)

        expect(wrapper.find('input[name="requiredName[0].value"]').attributes('aria-required')).toBe('true')
        expect(wrapper.find('input[name="zodEmail[0].value"]').attributes('aria-required')).toBe('true')
        expect(wrapper.find('input[name="optionalEmail[0].value"]').attributes('aria-required')).toBeUndefined()
        expect(wrapper.find('textarea[name="optionalNote[0].value"]').attributes('aria-required')).toBeUndefined()
        expect(wrapper.find('input[name="requiredEmails[0].value"]').attributes('aria-required')).toBe('true')

        const arrayLegend = wrapper.findAll('[data-slot="field-legend"]').find(
            (legend) => legend.text().includes('Required email list'),
        )
        expect(arrayLegend?.find('[data-slot="required-indicator"]').exists()).toBe(true)
    })

    it('reacts to dependent visibility, schema changes, and runtime disabled state', async () => {
        const { api, wrapper } = await mountForm([
            { fieldName: 'role', label: 'Role', component: 'Input' },
            {
                fieldName: 'secret',
                label: 'Secret',
                component: 'Input',
                show: ({ values }) => (values.role as Array<{ value: string }>)?.[0]?.value === 'admin',
                disabled: ({ values }) => (values.role as Array<{ value: string }>)?.[0]?.value === 'locked',
            },
        ])

        expect(wrapper.find('input[name="secret[0].value"]').exists()).toBe(false)
        await api.setValues({ role: [{ value: 'admin' }] })
        await nextTick()
        expect(wrapper.find('input[name="secret[0].value"]').exists()).toBe(true)

        api.appendSchemaByField({ fieldName: 'note', label: 'Note', component: 'Textarea' }, 'role')
        await nextTick()
        expect(wrapper.find('textarea[name="note[0].value"]').exists()).toBe(true)

        api.setProps({ disabled: true })
        await nextTick()
        expect(wrapper.find('fieldset').attributes('disabled')).toBeDefined()
    })

    it('consumes dependency callbacks from declared trigger fields', async () => {
        const { api, wrapper } = await mountForm([
            { fieldName: 'mode', label: 'Mode', component: 'Input' },
            {
                fieldName: 'secret',
                label: 'Secret',
                component: 'Input',
                dependencies: {
                    triggerFields: ['mode'],
                    if: ({ values }) => ['enabled', 'locked'].includes(
                        (values.mode as Array<{ value: string }>)?.[0]?.value,
                    ),
                    disabled: ({ values }) => (values.mode as Array<{ value: string }>)?.[0]?.value === 'locked',
                },
            },
        ])

        expect(wrapper.find('input[name="secret[0].value"]').exists()).toBe(false)
        await api.setValues({ mode: [{ value: 'enabled' }] })
        await nextTick()
        expect(wrapper.find('input[name="secret[0].value"]').exists()).toBe(true)
        await api.setValues({ mode: [{ value: 'locked' }] })
        await nextTick()
        expect(wrapper.find('input[name="secret[0].value"]').attributes('disabled')).toBeDefined()
    })

    it('resolves dependency component props and dynamic rules from current values', async () => {
        const { api, wrapper } = await mountForm([
            { fieldName: 'mode', label: 'Mode', component: 'Input' },
            {
                fieldName: 'detail',
                label: 'Detail',
                component: 'Input',
                dependencies: {
                    triggerFields: ['mode'],
                    componentProps: ({ values }) => ({
                        placeholder: (values.mode as Array<{ value?: string }>)?.[0]?.value === 'strict'
                            ? 'Strict detail'
                            : 'Optional detail',
                    }),
                    rules: ({ values }) => (
                        (values.mode as Array<{ value?: string }>)?.[0]?.value === 'strict'
                            ? 'required'
                            : undefined
                    ),
                },
            },
            {
                fieldName: 'requiredDetail',
                label: 'Required detail',
                component: 'Input',
                dependencies: {
                    triggerFields: ['mode'],
                    required: ({ values }) => (
                        (values.mode as Array<{ value?: string }>)?.[0]?.value === 'strict'
                    ),
                },
            },
        ])

        const detail = () => wrapper.find<HTMLInputElement>('input[name="detail[0].value"]')
        expect(detail().attributes('placeholder')).toBe('Optional detail')
        await api.setValues({ mode: [{ value: 'strict' }] })
        await nextTick()
        expect(detail().attributes('placeholder')).toBe('Strict detail')

        await expect(api.validateField('detail')).resolves.toEqual({ valid: false })
        expect(api.errors.value['detail[0].value']).toBe('必填')
        await expect(api.validateField('requiredDetail')).resolves.toEqual({ valid: false })
        expect(api.errors.value['requiredDetail[0].value']).toBe('必填')

        await api.setValues({ mode: [{ value: 'relaxed' }] })
        await nextTick()
        await expect(api.validateField('detail')).resolves.toEqual({ valid: true })
        expect(api.errors.value['detail[0].value']).toBeUndefined()
        await expect(api.validateField('requiredDetail')).resolves.toEqual({ valid: true })
        expect(api.errors.value['requiredDetail[0].value']).toBeUndefined()
    })

    it('runs dependency onChange after writing the field value', async () => {
        const onChange = vi.fn()
        const { wrapper } = await mountForm([
            {
                fieldName: 'name',
                label: 'Name',
                component: 'Input',
                dependencies: {
                    triggerFields: [],
                    onChange,
                },
            },
        ])

        const input = wrapper.find<HTMLInputElement>('input[name="name[0].value"]')
        await input.setValue('Ada')
        await nextTick()

        expect(onChange).toHaveBeenCalledWith(
            'Ada',
            expect.objectContaining({ fieldName: 'name', value: 'Ada' }),
        )
    })

    it('excludes hidden dependent fields from validation while preserving their values', async () => {
        const { api, wrapper } = await mountForm([
            { fieldName: 'enabled', label: 'Enabled', component: 'Input' },
            {
                fieldName: 'advanced',
                label: 'Advanced',
                component: 'Input',
                dependencies: {
                    triggerFields: ['enabled'],
                    show: ({ values }) => (values.enabled as Array<{ value: string }>)?.[0]?.value === 'yes',
                },
                rules: 'required',
            },
        ])

        await api.setValues({ enabled: [{ value: 'yes' }] })
        await nextTick()
        await expect(api.validate()).resolves.toMatchObject({ valid: false })
        expect(api.errors.value['advanced[0].value']).toBe('必填')

        await api.setValues({ advanced: [{ value: 'saved' }], enabled: [{ value: 'no' }] })
        await nextTick()
        expect(wrapper.find('input[name="advanced[0].value"]').exists()).toBe(false)
        await expect(api.validate()).resolves.toMatchObject({ valid: true })
        expect((await api.getValues()).advanced).toEqual([{ value: 'saved' }])
    })

    it('renders children as fields inside an array row', async () => {
        const { api, wrapper } = await mountForm([
            {
                fieldName: 'contacts',
                label: 'Contacts',
                component: 'Input',
                array: true,
                children: [
                    { fieldName: 'name', label: 'Name', component: 'Input' },
                    { fieldName: 'phone', label: 'Phone', component: 'Input' },
                ],
            },
        ], { initialValues: { contacts: [{ name: 'Ada', phone: '1' }] } })

        expect((wrapper.find('input[name="contacts[0].name"]').element as HTMLInputElement).value).toBe('Ada')
        expect((wrapper.find('input[name="contacts[0].phone"]').element as HTMLInputElement).value).toBe('1')
        await api.setValues({ contacts: [{ name: 'Grace' }] })
        await nextTick()
        expect((wrapper.find('input[name="contacts[0].name"]').element as HTMLInputElement).value).toBe('Grace')
        expect((wrapper.find('input[name="contacts[0].phone"]').element as HTMLInputElement).value).toBe('1')
    })

    it('recursively renders nested child objects and shows nested validation errors', async () => {
        const { api, wrapper } = await mountForm([
            {
                fieldName: 'contacts',
                label: 'Contacts',
                component: 'Input',
                array: true,
                children: [
                    {
                        fieldName: 'address',
                        label: 'Address',
                        component: 'Input',
                        children: [
                            { fieldName: 'city', label: 'City', component: 'Input', rules: 'required' },
                            { fieldName: 'country', label: 'Country', component: 'Input', defaultValue: 'US' },
                        ],
                    },
                ],
            },
        ], { initialValues: { contacts: [{ address: { city: '', country: 'CA' } }] } })

        const city = wrapper.find<HTMLInputElement>('input[name="contacts[0].address.city"]')
        const country = wrapper.find<HTMLInputElement>('input[name="contacts[0].address.country"]')
        expect(city.exists()).toBe(true)
        expect((city.element as HTMLInputElement).value).toBe('')
        expect((country.element as HTMLInputElement).value).toBe('CA')

        const cityLabel = wrapper.findAll('label').find(
            (label) => label.attributes('for') === 'AForm-contacts[0].address.city',
        )
        expect(cityLabel?.find('[data-slot="required-indicator"]').exists()).toBe(true)

        await wrapper.find('form').trigger('submit')
        await vi.waitFor(() => expect(api.loading).toBe(false))
        expect(api.errors.value['contacts[0].address.city']).toBe('必填')
        expect(wrapper.find('[data-slot="field-error"]').text()).toContain('必填')
    })

    it('initializes and appends nested array child rows recursively', async () => {
        const { api, wrapper } = await mountForm([
            {
                fieldName: 'contacts',
                label: 'Contacts',
                component: 'Input',
                array: true,
                children: [
                    {
                        fieldName: 'phones',
                        label: 'Phones',
                        component: 'Input',
                        array: true,
                        children: [
                            { fieldName: 'number', label: 'Number', component: 'Input', defaultValue: '000' },
                        ],
                    },
                ],
            },
        ], { initialValues: { contacts: [{ phones: [{ number: '123' }] }] } })

        expect((wrapper.find('input[name="contacts[0].phones[0].number"]').element as HTMLInputElement).value).toBe('123')
        const phonesFieldset = wrapper.findAll('fieldset')
            .find((fieldset) => fieldset.find('legend').text() === 'Phones')
        expect(phonesFieldset).toBeDefined()
        const addButton = phonesFieldset!.findAll('button')
            .find((button) => button.text().includes('+ 添加'))
        expect(addButton).toBeDefined()
        await addButton!.trigger('click')
        await nextTick()
        expect((wrapper.find('input[name="contacts[0].phones[1].number"]').element as HTMLInputElement).value).toBe('000')
        expect((await api.getValues()).contacts).toEqual([
            { phones: [{ number: '123' }, { number: '000' }] },
        ])
    })

    it('uses vee nested paths consistently for dotted field names', async () => {
        const { api, wrapper } = await mountForm([
            { fieldName: 'profile.email', label: 'Email', component: 'Email', rules: 'required,email' },
        ], { initialValues: { profile: { email: [{ value: 'ada@example.com' }] } } })

        const input = wrapper.find<HTMLInputElement>('input[name="profile.email[0].value"]')
        expect((input.element as HTMLInputElement).value).toBe('ada@example.com')
        await api.setValues({ profile: { email: [{ value: 'grace@example.com' }] } })
        await nextTick()
        expect((input.element as HTMLInputElement).value).toBe('grace@example.com')
    })

    it('keeps useAForm as a compatibility surface for the same FormApi', async () => {
        let api!: FormApi
        const Host = defineComponent({
            setup() {
                const result = useAForm({ schema: [{ fieldName: 'name', label: 'Name', component: 'Input' }] })
                api = result.api
                expect(result.errors).toBe(result.api.errors)
                expect(result.values).toBe(result.api.values)
                return () => h(result.AForm)
            },
        })
        wrapper = mount(Host)
        await flushPromises()
        expect(api.form).not.toBeNull()
        expect(wrapper.find('input[name="name[0].value"]').exists()).toBe(true)
    })
})
