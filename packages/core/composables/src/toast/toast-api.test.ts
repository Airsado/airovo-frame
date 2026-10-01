import { describe, expect, it } from 'vitest'
import { toast, useToast } from './index'

describe('useToast', () => {
    it('returns the shared vue-sonner controller', () => {
        const api = useToast()

        expect(api).toBe(toast)
        expect(api.success).toBeTypeOf('function')
        expect(api.error).toBeTypeOf('function')
        expect(api.info).toBeTypeOf('function')
        expect(api.warning).toBeTypeOf('function')
        expect(api.loading).toBeTypeOf('function')
        expect(api.dismiss).toBeTypeOf('function')
    })
})
