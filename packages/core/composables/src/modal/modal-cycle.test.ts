import { describe, expect, it } from 'vitest'
import { ModalApi } from './modal-api'
import { DrawerApi } from '../drawer/drawer-api'

function deferred<T>() {
    let resolve!: (value: T) => void
    let reject!: (error: Error) => void
    const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail })
    return { promise, resolve, reject }
}

describe.each([{ name: 'Modal', Controller: ModalApi }, { name: 'Drawer', Controller: DrawerApi }])('$name open-cycle isolation', ({ Controller }) => {
    it('does not record an old confirmation result or settle the new waiter', async () => {
        const old = deferred<{ id: string }>()
        const current = deferred<void>()
        const api = new Controller<{ id: string }, { id: string }>({
            onConfirm: (data) => data?.id === 'A' ? old.promise : current.promise,
        })
        api.open({ id: 'A' })
        const oldWaiter = api.waitForResult()
        const confirmation = api.confirm()
        api.open({ id: 'B' })
        await expect(oldWaiter).resolves.toEqual({ accepted: false, reason: 'api' })
        const newWaiter = api.waitForResult()
        let settled = false
        void newWaiter.then(() => { settled = true })
        old.resolve({ id: 'A' })
        await expect(confirmation).resolves.toBe(false)
        expect(api.getData()).toEqual({ id: 'B' })
        expect(api.getResult()).toBeUndefined()
        expect(api.state.error).toBeUndefined()
        expect(settled).toBe(false)
        const next = api.confirm()
        current.resolve()
        await expect(next).resolves.toBe(true)
        await expect(newWaiter).resolves.toEqual({ accepted: true, reason: 'confirm', result: undefined })
    })

    it('rejects the old caller without overwriting the new error/loading or confirm operation', async () => {
        const old = deferred<void>()
        const current = deferred<void>()
        const api = new Controller<{ id: string }>({ onConfirm: (data) => data?.id === 'A' ? old.promise : current.promise })
        api.open({ id: 'A' })
        const previous = api.confirm()
        const rejected = expect(previous).rejects.toThrow('Old failure')
        api.open({ id: 'B' })
        const next = api.confirm()
        api.setState({ error: 'Current error' })
        old.reject(new Error('Old failure'))
        await rejected
        expect(api.state.error).toBe('Current error')
        expect(api.state.loading).toBe(true)
        expect(api.confirm()).toBe(next)
        current.resolve()
        await expect(next).resolves.toBe(true)
        expect(api.state.loading).toBe(false)
    })

    it.each(['cancel', 'close'] as const)('isolates stale %s rejection while preserving its caller contract', async (action) => {
        const old = deferred<void>()
        let calls = 0
        const handler = () => ++calls === 1 ? old.promise : undefined
        const api = new Controller(action === 'cancel' ? { onCancel: handler } : { onBeforeClose: handler })
        api.open()
        const previous = action === 'cancel' ? api.cancel() : api.close()
        const outcome = action === 'cancel' ? expect(previous).rejects.toThrow('Old failure') : expect(previous).resolves.toBe(false)
        api.open()
        const waiter = api.waitForResult()
        api.setState({ error: 'Current error' })
        old.reject(new Error('Old failure'))
        await outcome
        expect(api.state.error).toBe('Current error')
        expect(api.state.open).toBe(true)
        expect(api.state.loading).toBe(false)
        await api.close()
        await expect(waiter).resolves.toEqual({ accepted: false, reason: 'api' })
    })

    it('does not commit a pending result after API close in the same generation', async () => {
        const old = deferred<{ id: string }>()
        const api = new Controller<undefined, { id: string }>({ onConfirm: () => old.promise })
        api.open()
        const confirmation = api.confirm()
        const waiter = api.waitForResult()
        await api.close()
        old.resolve({ id: 'A' })
        await expect(confirmation).resolves.toBe(false)
        expect(api.getResult()).toBeUndefined()
        await expect(waiter).resolves.toEqual({ accepted: false, reason: 'api' })
    })
})
