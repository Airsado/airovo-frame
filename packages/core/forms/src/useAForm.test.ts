import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { useAForm, createLoginSchema, createRegisterSchema, createChangePasswordSchema, FormApi } from './index'

describe('FormApi', () => {
    it('initializes with schema', () => {
        const api = new FormApi({
            schema: [{ fieldName: 'name', component: 'Input' }],
        })
        expect(api.schema).toHaveLength(1)
        expect(api.schema[0].fieldName).toBe('name')
    })

    it('getValues returns empty before mount', () => {
        const api = new FormApi({ schema: [] })
        expect(api.getValues()).toEqual({})
    })

    it('setSchema replaces schema', () => {
        const api = new FormApi({ schema: [{ fieldName: 'a' }] })
        api.setSchema([{ fieldName: 'b' }])
        expect(api.schema).toHaveLength(1)
        expect(api.schema[0].fieldName).toBe('b')
    })

    it('updateSchema merges by fieldName', () => {
        const api = new FormApi({
            schema: [
                { fieldName: 'a', label: 'Old' },
                { fieldName: 'b' },
            ],
        })
        api.updateSchema([{ fieldName: 'a', label: 'New' }])
        expect(api.schema[0].label).toBe('New')
        expect(api.schema).toHaveLength(2)
    })

    it('removeSchemaByFields removes fields', () => {
        const api = new FormApi({
            schema: [{ fieldName: 'a' }, { fieldName: 'b' }, { fieldName: 'c' }],
        })
        api.removeSchemaByFields(['a', 'c'])
        expect(api.schema).toHaveLength(1)
        expect(api.schema[0].fieldName).toBe('b')
    })
})

describe('Preset factories', () => {
    it('createLoginSchema has username + password', () => {
        const s = createLoginSchema()
        const names = s.schema.map((f) => f.fieldName)
        expect(names).toContain('username')
        expect(names).toContain('password')
    })

    it('createRegisterSchema has 4 fields', () => {
        const s = createRegisterSchema()
        expect(s.schema).toHaveLength(4)
        const email = s.schema.find((f) => f.fieldName === 'email')
        expect(email?.component).toBe('Email')
    })

    it('createChangePasswordSchema has 3 fields', () => {
        const s = createChangePasswordSchema()
        const names = s.schema.map((f) => f.fieldName)
        expect(names).toEqual(['currentPassword', 'newPassword', 'confirmPassword'])
    })

    it('createRegisterSchema validation rejects mismatched passwords', () => {
        const s = createRegisterSchema()
        const result = (s.validation as z.ZodType<any>).safeParse({
            username: 'u',
            email: 'a@b.com',
            password: '123456',
            confirmPassword: 'different',
        })
        expect(result.success).toBe(false)
    })

    it('createRegisterSchema validation rejects short password', () => {
        const s = createRegisterSchema()
        const result = (s.validation as z.ZodType<any>).safeParse({
            username: 'u',
            email: 'a@b.com',
            password: '123',
            confirmPassword: '123',
        })
        expect(result.success).toBe(false)
    })
})
