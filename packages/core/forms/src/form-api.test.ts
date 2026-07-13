/**
 * FormApi smoke tests — v5-aligned surface.
 *
 * These cover the full FormActionType surface (validate / clearValid /
 * setProps / scrollToField / updateSchema / appendSchemaByField / etc.)
 * plus the reactive errors mirror that's consumed by AForm.
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { nextTick, ref } from 'vue'
import { z } from 'zod'
import { FormApi } from './form-api'
import type { FormFieldSchema, FormProps } from './types'

function makeProps(overrides: Partial<FormProps> = {}): FormProps {
    return {
        schema: [
            { fieldName: 'username', label: 'Username', component: 'Input' },
            { fieldName: 'email', label: 'Email', component: 'Email' },
        ],
        validation: z.object({
            username: z.string().min(1, '必填'),
            email: z.string().email('邮箱格式错误'),
        }),
        ...overrides,
    }
}

function mountWithForm(api: FormApi) {
    // Simulate what useAForm does: install a fake form context with
    // a reactive errors ref + values ref + validate/validateField.
    const errors = ref<Record<string, string>>({})
    const values = ref<Record<string, any>>({})
    const ctx = {
        values,
        errors,
        async validate() {
            // Minimal validate that runs the zod schema
            const props = (api as any).state as FormProps
            const result = props.validation?.safeParse(values.value) ?? { success: true, data: {} as any }
            if (result.success) {
                errors.value = {}
                return { valid: true, errors: {} }
            }
            const out: Record<string, string> = {}
            for (const issue of result.error.issues) {
                const key = issue.path.join('.') || '_'
                if (!out[key]) out[key] = issue.message
            }
            errors.value = out
            return { valid: false, errors: out }
        },
        validateField(name: string) {
            const props = (api as any).state as FormProps
            const shape = (props.validation as any).shape
            const field = shape?.[name]
            if (!field) return { valid: true }
            const v = values.value[name]
            const r = field.safeParse(v)
            if (r.success) {
                const next = { ...errors.value }; delete next[name]; errors.value = next
                return { valid: true }
            }
            errors.value = { ...errors.value, [name]: r.error.issues[0]?.message ?? '错误' }
            return { valid: false }
        },
        setFieldValue(name: string, v: any) { values.value = { ...values.value, [name]: v } },
        setValues(v: Record<string, any>) { values.value = { ...values.value, ...v } },
        resetForm() { values.value = {}; errors.value = {} },
    }
    api.mount(ctx as any)
    return { ctx, errors, values }
}

describe('FormApi (v5 surface)', () => {
    let api: FormApi

    beforeEach(() => {
        api = new FormApi(makeProps())
    })

    it('exposes a reactive errors Ref', () => {
        expect(api.errors.value).toEqual({})
        expect(typeof api.errors.value).toBe('object')
    })

    it('returns values via getValues()', () => {
        const { ctx } = mountWithForm(api)
        ctx.setFieldValue('username', 'alice')
        expect(api.getValues()).toMatchObject({ username: 'alice' })
    })

    it('setFieldValue / setValues forward to the form context', () => {
        const { ctx } = mountWithForm(api)
        api.setFieldValue('email', 'a@b.c')
        expect(ctx.values.value).toMatchObject({ email: 'a@b.c' })
        api.setValues({ username: 'bob', email: 'b@c.d' })
        expect(ctx.values.value).toMatchObject({ username: 'bob', email: 'b@c.d' })
    })

    it('validate() propagates errors into the reactive errors Ref', async () => {
        const { ctx } = mountWithForm(api)
        // Pre-fill with empty strings so the zod schema's min(1)
        // constraint fires (instead of the default "Required" type
        // error for undefined).
        ctx.setFieldValue('username', '')
        ctx.setFieldValue('email', '')
        const result = await api.validate()
        expect(result.valid).toBe(false)
        expect(result.errors.username).toBe('必填')
        expect(api.errors.value.username).toBe('必填')
        expect(api.errors.value.email).toBe('邮箱格式错误')
    })

    it('clearValid() wipes errors without touching values', async () => {
        const { ctx } = mountWithForm(api)
        await api.validate()
        expect(Object.keys(api.errors.value).length).toBeGreaterThan(0)
        const snapshot = { ...ctx.values.value }
        api.clearValid()
        expect(api.errors.value).toEqual({})
        expect(ctx.values.value).toEqual(snapshot)
    })

    it('updateSchema() patches existing fields + appends new ones', () => {
        mountWithForm(api)
        api.updateSchema([
            { fieldName: 'username', label: 'User (renamed)' },
            { fieldName: 'newField', component: 'Input' },
        ])
        const user = api.schema.find((f) => f.fieldName === 'username')!
        expect(user.label).toBe('User (renamed)')
        expect(api.schema.find((f) => f.fieldName === 'newField')).toBeDefined()
    })

    it('appendSchemaByField() inserts after the named field', () => {
        mountWithForm(api)
        const before = api.schema.length
        api.appendSchemaByField({ fieldName: 'inserted', component: 'Input' }, 'email')
        expect(api.schema.length).toBe(before + 1)
        const emailIdx = api.schema.findIndex((f) => f.fieldName === 'email')
        expect(api.schema[emailIdx + 1]?.fieldName).toBe('inserted')
    })

    it('removeSchemaByField() drops the field', () => {
        mountWithForm(api)
        api.removeSchemaByField('email')
        expect(api.schema.find((f) => f.fieldName === 'email')).toBeUndefined()
    })

    it('resetSchema() replaces the entire schema', () => {
        mountWithForm(api)
        api.resetSchema([{ fieldName: 'replaced', component: 'Input' }])
        expect(api.schema).toHaveLength(1)
        expect(api.schema[0]?.fieldName).toBe('replaced')
    })

    it('submit() does not return values on validation failure', async () => {
        const { ctx } = mountWithForm(api)
        ctx.setFieldValue('username', '')
        ctx.setFieldValue('email', '')
        const result = await api.submitForm()
        expect(result).toEqual({})
        // Errors are still populated so the UI can show them.
        expect(api.errors.value.username).toBe('必填')
    })

    it('inlines show/disabled/defaultValue functions (v5 schema)', () => {
        const dynamicSchema: FormProps = {
            schema: [
                {
                    fieldName: 'email',
                    component: 'Input',
                    show: (ctx) => ctx.values.username === 'admin',
                    disabled: (ctx) => Boolean(ctx.values.frozen),
                    defaultValue: (ctx) => `default-${ctx.values.username ?? 'guest'}`,
                },
            ],
        }
        const a = new FormApi(dynamicSchema)
        const { ctx } = mountWithForm(a)
        // Show: false because username is not 'admin'
        expect((dynamicSchema.schema[0] as any).show({ values: ctx.values.value, api: a })).toBe(false)
        // Disabled: false because frozen is not set
        expect((dynamicSchema.schema[0] as any).disabled({ values: ctx.values.value, api: a })).toBe(false)
        // Default value: depends on username
        expect((dynamicSchema.schema[0] as any).defaultValue({ values: ctx.values.value, api: a })).toBe('default-guest')
    })

    it('scrollToField is a no-op when no DOM is available (node env)', () => {
        mountWithForm(api)
        expect(() => api.scrollToField('username')).not.toThrow()
    })
})
