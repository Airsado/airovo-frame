import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DrawerApi } from '../drawer/drawer-api'
import { ModalApi } from '../modal/modal-api'
import { OverlayStack } from './overlay-stack'

describe('OverlayStack', () => {
    let stack: OverlayStack

    beforeEach(() => {
        document.body.style.overflow = 'auto'
        stack = new OverlayStack({ baseZIndex: 1000, zIndexStep: 10 })
    })

    afterEach(() => {
        stack.clear()
        document.body.style.overflow = ''
    })

    it('allocates ordered backdrop and content z-index values', () => {
        const parent = stack.acquire()
        const child = stack.acquire()
        const dialog = stack.acquire()

        expect(parent.overlayZIndex.value).toBe(1000)
        expect(parent.zIndex.value).toBe(1001)
        expect(parent.popupZIndex.value).toBe(1002)
        expect(child.overlayZIndex.value).toBe(1010)
        expect(parent.popupZIndex.value).toBeLessThan(child.overlayZIndex.value)
        expect(child.zIndex.value).toBe(1011)
        expect(dialog.overlayZIndex.value).toBe(1020)
        expect(dialog.zIndex.value).toBe(1021)
        expect(parent.isTop()).toBe(false)
        expect(child.isTop()).toBe(false)
        expect(dialog.isTop()).toBe(true)
        expect(stack.size).toBe(3)
    })

    it('reactively deactivates covered or released owners and reactivates the parent', () => {
        const parent = stack.acquire()
        expect(parent.isActive.value).toBe(true)
        const child = stack.acquire()
        expect(parent.isActive.value).toBe(false)
        expect(child.isActive.value).toBe(true)
        child.release()
        expect(child.isActive.value).toBe(false)
        expect(parent.isActive.value).toBe(true)
        parent.release()
        expect(parent.isActive.value).toBe(false)
    })

    it('rejects a layer gap too small to reserve the owning popup', () => {
        expect(() => new OverlayStack({ zIndexStep: 2 })).toThrow(RangeError)
    })

    it('dispatches Escape only to the topmost entry', () => {
        const parentEscape = vi.fn()
        const childEscape = vi.fn()
        const parent = stack.acquire({ onEscape: parentEscape })
        const child = stack.acquire({ onEscape: childEscape })

        expect(stack.dispatchEscape()).toBe(true)
        expect(childEscape).toHaveBeenCalledOnce()
        expect(parentEscape).not.toHaveBeenCalled()

        child.release()
        expect(stack.dispatchEscape()).toBe(true)
        expect(parentEscape).toHaveBeenCalledOnce()
        expect(parent.isTop()).toBe(true)
    })

    it('dispatches outside interactions only to the topmost entry', () => {
        const parentOutside = vi.fn()
        const childOutside = vi.fn()
        const parent = stack.acquire({ onOutside: parentOutside })
        const child = stack.acquire({ onOutside: childOutside })

        expect(child.tryOutside()).toBe(true)
        expect(childOutside).toHaveBeenCalledOnce()
        expect(parentOutside).not.toHaveBeenCalled()

        child.release()
        expect(parent.tryOutside()).toBe(true)
        expect(parentOutside).toHaveBeenCalledOnce()
    })

    it('reference-counts body scroll locking and restores the prior overflow', () => {
        const parent = stack.acquire()
        const child = stack.acquire()

        expect(stack.bodyLockCount).toBe(2)
        expect(document.body.style.overflow).toBe('hidden')

        parent.release()
        expect(stack.bodyLockCount).toBe(1)
        expect(document.body.style.overflow).toBe('hidden')

        child.release()
        expect(stack.bodyLockCount).toBe(0)
        expect(document.body.style.overflow).toBe('auto')

        child.release()
        expect(stack.bodyLockCount).toBe(0)
    })

    it('supports entries that opt out of body scroll locking', () => {
        const entry = stack.acquire({ lockBodyScroll: false })

        expect(stack.bodyLockCount).toBe(0)
        expect(document.body.style.overflow).toBe('auto')
        entry.release()
    })

    it('restores the opener focus after a nested overlay closes', async () => {
        const opener = document.createElement('button')
        document.body.append(opener)
        opener.focus()
        const entry = stack.acquire()

        const child = document.createElement('button')
        document.body.append(child)
        child.focus()
        entry.release()
        await new Promise<void>((resolve) => queueMicrotask(resolve))

        expect(document.activeElement).toBe(opener)
        child.remove()
        opener.remove()
    })

    it('clear releases all entries and restores body state', () => {
        stack.acquire()
        stack.acquire()
        stack.clear()

        expect(stack.size).toBe(0)
        expect(stack.bodyLockCount).toBe(0)
        expect(document.body.style.overflow).toBe('auto')
    })

    it('restores the previously focused element when a layer closes', () => {
        const opener = document.createElement('button')
        document.body.append(opener)
        opener.focus()

        const entry = stack.acquire()
        const content = document.createElement('button')
        document.body.append(content)
        content.focus()
        entry.release()

        expect(document.activeElement).toBe(opener)
        opener.remove()
        content.remove()
    })

    it('coordinates a typed drawer -> modal -> dialog flow', async () => {
        const drawer = new DrawerApi<{ channelId: number }, { saved: boolean }>()
        const modal = new ModalApi<{ channelId: number }, { approved: boolean }>()
        const dialog = new ModalApi<{ field: string }, { value: string }>()
        drawer.open({ channelId: 42 })
        modal.open({ channelId: 42 })
        dialog.open({ field: 'name' })

        const drawerLayer = stack.acquire()
        const modalLayer = stack.acquire()
        const dialogLayer = stack.acquire()
        expect(drawerLayer.isTop()).toBe(false)
        expect(modalLayer.isTop()).toBe(false)
        expect(dialogLayer.isTop()).toBe(true)

        const result = dialog.waitForResult()
        await dialog.confirm({ value: 'demo' })
        await expect(result).resolves.toEqual({
            accepted: true,
            reason: 'confirm',
            result: { value: 'demo' },
        })
        dialogLayer.release()

        const modalResult = modal.waitForResult()
        await modal.cancel()
        await expect(modalResult).resolves.toEqual({ accepted: false, reason: 'cancel' })
        modalLayer.release()

        const drawerResult = drawer.waitForResult()
        await drawer.confirm({ saved: true })
        await expect(drawerResult).resolves.toEqual({
            accepted: true,
            reason: 'confirm',
            result: { saved: true },
        })
        drawerLayer.release()
        expect(stack.size).toBe(0)
    })
})
