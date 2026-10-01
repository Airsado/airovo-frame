import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ModalApi } from './modal-api'

describe('ModalApi', () => {
    let api: ModalApi<{ id: string }>

    beforeEach(() => {
        api = new ModalApi<{ id: string }>({ title: '编辑记录' })
    })

    it('opens with payload and mirrors the open aliases', () => {
        const onOpenChange = vi.fn()
        api = new ModalApi({ onOpenChange })
        api.open({ id: 'a' })

        expect(api.state.open).toBe(true)
        expect(api.state.isOpen).toBe(true)
        expect(api.getData()).toEqual({ id: 'a' })
        expect(onOpenChange).toHaveBeenCalledWith(true, api)
    })

    it('supports object and updater state changes', () => {
        api.setState({ title: '新标题' })
        api.setState((previous) => ({ description: `${previous.title}说明` }))

        expect(api.state.title).toBe('新标题')
        expect(api.state.description).toBe('新标题说明')
    })

    it('honors an async before-close guard', async () => {
        const onBeforeClose = vi.fn(async () => false)
        api = new ModalApi({ onBeforeClose })
        api.open()

        await expect(api.close('escape')).resolves.toBe(false)
        expect(api.state.open).toBe(true)
        expect(onBeforeClose).toHaveBeenCalledWith('escape', api)
    })

    it('deduplicates async confirm and clears loading after success', async () => {
        let resolve!: () => void
        const onConfirm = vi.fn(() => new Promise<void>((done) => { resolve = done }))
        api = new ModalApi({ onConfirm })
        api.open({ id: 'a' })

        const first = api.confirm()
        const second = api.confirm()
        expect(first).toBe(second)
        expect(api.state.loading).toBe(true)
        resolve()
        await expect(first).resolves.toBe(true)
        expect(onConfirm).toHaveBeenCalledWith({ id: 'a' }, api)
        expect(api.state.loading).toBe(false)
        expect(api.state.open).toBe(false)
    })

    it('can keep the modal open after confirm and cancel handlers', async () => {
        const onConfirm = vi.fn()
        const onCancel = vi.fn()
        api = new ModalApi({ onConfirm, onCancel, closeOnConfirm: false, closeOnCancel: false })
        api.open()

        await api.confirm()
        await api.cancel()

        expect(onConfirm).toHaveBeenCalledOnce()
        expect(onCancel).toHaveBeenCalledOnce()
        expect(api.state.open).toBe(true)
    })

    it('locks interaction until unlocked', async () => {
        api.open()
        api.lock()

        expect(await api.cancel()).toBe(false)
        expect(await api.close('outside')).toBe(false)
        api.unlock()
        expect(await api.close()).toBe(true)
    })
})
