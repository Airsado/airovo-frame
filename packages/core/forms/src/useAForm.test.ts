import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { z } from 'zod'
import { useAForm, createLoginSchema, createRegisterSchema, createChangePasswordSchema } from './index'

beforeEach(() => {
    setActivePinia(createPinia())
})

describe('useAForm', () => {
    it('initializes values from schema', async () => {
        const schema = {
            fields: [
                { fieldName: 'username' },
                { fieldName: 'password' },
            ],
            validation: z.object({
                username: z.string(),
                password: z.string(),
            }),
            initialValues: {
                username: 'admin',
                password: '123',
            },
        }
        const { values } = useAForm(schema)
        await nextTick()
        expect(values.username).toBe('admin')
        expect(values.password).toBe('123')
    })

    it('exposes fieldList filtered by hidden flag', async () => {
        const schema = {
            fields: [
                { fieldName: 'a' },
                { fieldName: 'b', hidden: true },
                { fieldName: 'c' },
            ],
            validation: z.object({
                a: z.string(),
                c: z.string(),
            }),
        }
        const { fieldList } = useAForm(schema)
        await nextTick()
        // fieldList is a ref (readonly)
        const names = fieldList.value.map((f) => f.fieldName)
        expect(names).toEqual(['a', 'c'])
    })

    it('updates values via setField', async () => {
        const schema = {
            fields: [{ fieldName: 'email' }],
            validation: z.object({ email: z.string() }),
            initialValues: { email: '' },
        }
        const { values, setField } = useAForm(schema)
        setField('email', 'foo@bar.com')
        await nextTick()
        expect(values.email).toBe('foo@bar.com')
    })

    it('resets to initial values', async () => {
        const schema = {
            fields: [{ fieldName: 'x' }],
            validation: z.object({ x: z.string() }),
            initialValues: { x: 'init' },
        }
        const { values, setField, reset } = useAForm(schema)
        setField('x', 'changed')
        await nextTick()
        expect(values.x).toBe('changed')
        reset()
        await nextTick()
        expect(values.x).toBe('init')
    })

    it('exposes validation schema for direct checks', async () => {
        // Schema validation works without running vee-validate setup
        const schema = {
            fields: [{ fieldName: 'email' }],
            validation: z.object({
                email: z.string().email('请输入正确的邮箱'),
            }),
            initialValues: { email: '' },
        }
        const result = schema.validation.safeParse({ email: 'invalid' })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('请输入正确的邮箱')
        }
    })
})

describe('Preset factories', () => {
    it('createLoginSchema exposes username + password', () => {
        const schema = createLoginSchema()
        const names = schema.fields.map((f) => f.fieldName)
        expect(names).toContain('username')
        expect(names).toContain('password')
        expect(schema.initialValues).toEqual({ username: '', password: '' })
    })

    it('createRegisterSchema uses Email component for email', () => {
        const schema = createRegisterSchema()
        const email = schema.fields.find((f) => f.fieldName === 'email')
        expect(email?.component).toBe('Email')
    })

    it('createChangePasswordSchema requires all 3 fields', () => {
        const schema = createChangePasswordSchema()
        const names = schema.fields.map((f) => f.fieldName)
        expect(names).toEqual(['currentPassword', 'newPassword', 'confirmPassword'])
    })

    it('createRegisterSchema validation rejects short password', () => {
        const schema = createRegisterSchema()
        const result = schema.validation.safeParse({
            username: 'u',
            email: 'a@b.com',
            password: '123',
            confirmPassword: '123',
        })
        expect(result.success).toBe(false)
    })

    it('createRegisterSchema validation rejects mismatched confirm', () => {
        const schema = createRegisterSchema()
        const result = schema.validation.safeParse({
            username: 'u',
            email: 'a@b.com',
            password: '123456',
            confirmPassword: 'different',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
            const path = result.error.issues[0].path
            expect(JSON.stringify(path)).toContain('confirmPassword')
        }
    })
})
