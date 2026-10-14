import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive, readonly, ref, watch } from 'vue'
import type { FormContext } from 'vee-validate'
import { FormApi } from './form-api'
import type { FormFieldSchema } from './types'

type Values = Record<string, unknown>

function makeContext() {
    const values = ref<Values>({ username: 'initial' })
    const errors = ref<Record<string, string>>({})
    const isSubmitting = ref(false)

    const context = {
        values,
        errors,
        isSubmitting,
        async validate() {
            const valid = Object.keys(errors.value).length === 0
            return { valid, errors: { ...errors.value } }
        },
        async validateField(name: string) {
            return { valid: !errors.value[name], errors: errors.value[name] ? [errors.value[name]] : [] }
        },
        setFieldValue(name: string, value: unknown) {
            values.value = { ...values.value, [name]: value }
        },
        setValues(next: Values) {
            values.value = { ...values.value, ...next }
        },
        resetForm(state?: { values?: Values }) {
            values.value = { ...(state?.values ?? {}) }
            errors.value = {}
        },
        setErrors(next: Record<string, string>) {
            errors.value = { ...next }
        },
        setFieldError(name: string, message?: string) {
            const next = { ...errors.value }
            if (message) next[name] = message
            else delete next[name]
            errors.value = next
        },
    } as unknown as FormContext

    return { context, values, errors }
}

const schema = [
    { fieldName: 'username', label: '用户名', component: 'Input' as const },
    { fieldName: 'email', label: '邮箱', component: 'Input' as const },
]

describe('FormApi', () => {
    let api: FormApi

    beforeEach(() => {
        api = new FormApi({
            schema,
            initialValues: { username: 'initial' },
        })
    })

    it('mounts a vee-validate context and mirrors errors reactively', async () => {
        const { context, errors } = makeContext()
        api.mount(context)
        errors.value = { username: '用户名必填' }
        await nextTick()

        expect(api.errors.value).toEqual({ username: '用户名必填' })
        api.unmount()
        errors.value = { email: '不应继续同步' }
        await nextTick()
        expect(api.errors.value).toEqual({ username: '用户名必填' })
    })

    it('reads and writes values through the form context', async () => {
        const { context, values } = makeContext()
        api.mount(context)

        api.setFieldValue('email', 'a@b.com')
        await api.setValues({ username: 'alice', unknown: true })

        expect(values.value).toEqual({ username: 'alice', email: 'a@b.com' })
        await expect(api.getValues()).resolves.toEqual({ username: 'alice', email: 'a@b.com' })
        await expect(api.getValues(['email'])).resolves.toEqual({ email: 'a@b.com' })
        expect(api.values.value).toEqual({ username: 'alice', email: 'a@b.com' })
    })

    it('mirrors custom component errors and clears them on valid/reset paths', async () => {
        const { context } = makeContext()
        api.mount(context)
        api.setFieldError('username', 'JSON 格式无效')
        expect(api.errors.value.username).toBe('JSON 格式无效')
        await expect(api.validate()).resolves.toMatchObject({ valid: false })
        api.setFieldError('username')
        expect(api.errors.value.username).toBeUndefined()
        api.setFieldError('email', '错误')
        api.resetFields(['email'])
        expect(api.errors.value.email).toBeUndefined()
    })

    it('preserves a plain values object whose field is named value', async () => {
        const values = reactive<Values>({
            configKey: { value: 'settings' },
            value: { value: '{"enabled":true}' },
            nested: { value: [{ value: 1 }, { value: 2 }] },
        })
        const errors = ref<Record<string, string>>({})
        const context = {
            values,
            errors,
            isSubmitting: ref(false),
            async validate() { return { valid: true, errors: {} } },
            async validateField() { return { valid: true, errors: [] } },
            setFieldValue(name: string, value: unknown) { values[name] = value },
            setValues(next: Values) { Object.assign(values, next) },
            resetForm() {},
            setErrors(next: Record<string, string>) { errors.value = next },
            setFieldError() {},
        } as unknown as FormContext
        api = new FormApi({
            schema: [
                { fieldName: 'configKey', label: 'Config key', component: 'Input' },
                { fieldName: 'value', label: 'JSON text', component: 'Textarea' },
                { fieldName: 'nested', label: 'Nested', component: 'Input', array: true },
            ],
            handleSubmit: vi.fn(),
        })
        api.mount(context)

        await expect(api.getValues()).resolves.toEqual(values)
        await expect(api.getRawValues()).resolves.toEqual(values)
        await expect(api.getValueSnapshot()).resolves.toEqual({ rawValues: values, values })
        await expect(api.submitForm()).resolves.toEqual(values)
        expect(api.getLatestSubmissionValues()).toEqual(values)
    })

    it('unwraps only actual refs while preserving reactive and readonly value objects', async () => {
        const reactiveValues = reactive<Values>({ value: 'reactive', nested: { value: 1 } })
        const readonlyValues = readonly({ value: 'readonly', nested: { value: 2 } })
        for (const values of [reactiveValues, readonlyValues]) {
            const context = {
                values,
                errors: ref<Record<string, string>>({}),
                isSubmitting: ref(false),
                async validate() { return { valid: true, errors: {} } },
                async validateField() { return { valid: true, errors: [] } },
            } as unknown as FormContext
            api = new FormApi({ schema: [{ fieldName: 'value', label: 'Value', component: 'Input' }] })
            api.mount(context)
            await expect(api.getValues()).resolves.toEqual(values)
            await expect(api.getRawValues()).resolves.toEqual(values)
        }
    })

    it('exposes raw/snapshot/submission compatibility methods', async () => {
        const { context, values } = makeContext()
        api = new FormApi({ schema, handleSubmit: vi.fn() })
        api.mount(context)

        const raw = await api.getRawValues()
        const snapshot = await api.getValueSnapshot()
        expect(raw).toEqual(values.value)
        expect(snapshot).toEqual({ rawValues: values.value, values: values.value })
        raw.username = 'mutated-copy'
        expect(values.value.username).toBe('initial')

        await expect(api.validateAndSubmit()).resolves.toEqual(values.value)
        expect(api.getLatestSubmissionValues()).toEqual(values.value)
    })

    it('filters nested patches and preserves known siblings', async () => {
        const { context, values } = makeContext()
        values.value = {
            username: 'Ada',
            profile: { email: 'old@example.com', nickname: 'Ada', ignored: true },
        }
        api = new FormApi({
            schema: [
                ...schema,
                { fieldName: 'profile.email', label: 'Email', component: 'Input' },
                { fieldName: 'profile.nickname', label: 'Nickname', component: 'Input' },
            ],
        })
        api.mount(context)

        await api.setValues({ profile: { email: 'new@example.com', unknown: 'drop' } })

        expect(values.value.profile).toEqual({ email: 'new@example.com', nickname: 'Ada' })
        expect(values.value.profile).not.toHaveProperty('ignored')
    })

    it('filters nested array row patches by child schema', async () => {
        const { context, values } = makeContext()
        values.value = { contacts: [{ name: 'Ada', phone: '1', ignored: true }] }
        api = new FormApi({
            schema: [{
                fieldName: 'contacts', label: 'Contacts', component: 'Input', array: true,
                children: [
                    { fieldName: 'name', label: 'Name', component: 'Input' },
                    { fieldName: 'phone', label: 'Phone', component: 'Input' },
                ],
            } as FormFieldSchema],
        })
        api.mount(context)

        await api.setValues({ contacts: [{ name: 'Grace' }] })

        expect(values.value.contacts).toEqual([{ name: 'Grace', phone: '1' }])
    })

    it('validates, clears errors, and resets fields', async () => {
        const { context, errors, values } = makeContext()
        api.mount(context)
        errors.value = { username: '用户名必填', email: '邮箱格式错误' }

        const result = await api.validate()
        expect(result.valid).toBe(false)
        expect(api.errors.value.email).toBe('邮箱格式错误')

        api.clearValid()
        expect(api.errors.value).toEqual({})
        expect(errors.value).toEqual({})

        values.value = { username: 'changed', email: 'x' }
        api.resetFields(['username'])
        expect(values.value).toEqual({ username: 'initial', email: 'x' })
        expect(api.errors.value).toEqual({})

        api.resetForm()
        expect(values.value).toEqual({ username: 'initial' })
    })

    it('returns null on submit failure and values on success', async () => {
        const { context, errors } = makeContext()
        let submitted: Values | undefined
        api = new FormApi({ schema, handleSubmit: (values) => { submitted = values } })
        api.mount(context)

        errors.value = { username: '用户名必填' }
        await expect(api.submitForm()).resolves.toBeNull()

        errors.value = {}
        await expect(api.submitForm()).resolves.toEqual({ username: 'initial' })
        expect(submitted).toEqual({ username: 'initial' })
    })

    it('validates one field and preserves errors on the others', async () => {
        const { context, errors } = makeContext()
        api.mount(context)
        errors.value = { username: '必填', email: '邮箱格式错误' }

        await expect(api.validateField('username')).resolves.toEqual({ valid: false })
        expect(api.errors.value).toEqual({ username: '必填', email: '邮箱格式错误' })

        errors.value = { email: '邮箱格式错误' }
        await expect(api.validateField('username')).resolves.toEqual({ valid: true })
        expect(api.errors.value).toEqual({ email: '邮箱格式错误' })
    })

    it('reactively updates schema and runtime props', async () => {
        const names: string[][] = []
        const states: boolean[] = []
        watch(() => api.schema.map((field) => field.fieldName), (value) => names.push(value), { immediate: true })
        watch(() => api.disabled, (value) => states.push(value), { immediate: true })

        api.updateSchema([{ fieldName: 'username', label: '账户' }])
        api.appendSchemaByField({ fieldName: 'role', label: '角色', component: 'Input' }, 'username')
        api.removeSchemaByField('email')
        api.setProps({ disabled: true, loading: true })
        await nextTick()

        expect(api.schema.map((field) => field.fieldName)).toEqual(['username', 'role'])
        expect(names.at(-1)).toEqual(['username', 'role'])
        expect(states).toEqual([false, true])
        expect(api.getState()).toMatchObject({ values: {}, errors: {}, isSubmitting: false, loading: true, disabled: true })

        api.resetSchema([{ fieldName: 'replacement', label: '替换', component: 'Input' }])
        expect(api.schema.map((field) => field.fieldName)).toEqual(['replacement'])
        api.updateSchema([{ fieldName: 'incomplete' }])
        expect(api.schema.at(-1)).toMatchObject({ fieldName: 'incomplete', label: 'incomplete', component: 'Input' })
    })

    it('clears removed fields from live values and errors', async () => {
        const { context, values, errors } = makeContext()
        api.mount(context)
        values.value = { username: 'Ada', email: 'ada@example.com' }
        errors.value = { email: '格式错误' }

        api.removeSchemaByField('email')
        await nextTick()

        expect(values.value).toEqual({ username: 'Ada' })
        expect(api.errors.value).toEqual({})
        expect(await api.getValues()).toEqual({ username: 'Ada' })
    })

    it('keeps one async submit in flight and exposes loading', async () => {
        const { context } = makeContext()
        let resolveSubmit: (() => void) | undefined
        const handleSubmit = vi.fn(() => new Promise<void>((resolve) => { resolveSubmit = resolve }))
        api = new FormApi({ schema, handleSubmit })
        api.mount(context)

        const first = api.submitForm()
        const second = api.submitForm()
        expect(first).toBe(second)
        expect(api.loading).toBe(true)
        await vi.waitFor(() => expect(handleSubmit).toHaveBeenCalledOnce())
        resolveSubmit?.()
        await expect(first).resolves.toEqual({ username: 'initial' })
        expect(api.loading).toBe(false)
    })

    it('scrolls to the first failed field after async validation', async () => {
        const { context, errors } = makeContext()
        api.mount(context)
        const scroll = vi.spyOn(api, 'scrollToField').mockImplementation(() => {})
        errors.value = { 'username[0].value': '用户名必填', 'email[0].value': '邮箱格式错误' }

        await expect(api.submitForm()).resolves.toBeNull()
        expect(scroll).toHaveBeenCalledWith('username[0].value')
    })
})
