import { describe, expect, it } from 'vitest'
import { DrawerApi } from './drawer-api'

describe('DrawerApi', () => {
    it('defaults to a bottom drawer and accepts a right-side drawer', () => {
        expect(new DrawerApi().side).toBe('bottom')
        expect(new DrawerApi({ side: 'right' }).side).toBe('right')
    })

    it('shares the typed payload/result contract with ModalApi', async () => {
        const api = new DrawerApi<{ id: string }, { saved: boolean }>()
        api.open({ id: 'drawer-1' })

        const result = api.waitForResult()
        await expect(api.resolve({ saved: true })).resolves.toBe(true)

        await expect(result).resolves.toEqual({
            accepted: true,
            reason: 'confirm',
            result: { saved: true },
        })
    })

    it('does not resolve a child result when cancelled', async () => {
        const api = new DrawerApi<undefined, { saved: boolean }>()
        api.open()

        const result = api.waitForResult()
        await expect(api.cancel()).resolves.toBe(true)
        await expect(result).resolves.toEqual({ accepted: false, reason: 'cancel' })
    })
})
