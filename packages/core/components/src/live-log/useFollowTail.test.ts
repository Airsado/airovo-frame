import { describe, expect, it } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useFollowTail } from './useFollowTail'

function mockElement() {
    return {
        scrollHeight: 200,
        scrollTop: 100,
        clientHeight: 100,
        scrollTo({ top }: { top: number }) { this.scrollTop = top },
    } as unknown as HTMLElement
}

describe('useFollowTail', () => {
    it('follows appended items while the user remains at the tail', async () => {
        const items = ref<number[]>([1])
        const scope = effectScope()
        const api = scope.run(() => useFollowTail({ items }))!
        api.container.value = mockElement()
        items.value = [...items.value, 2]
        await nextTick()
        expect(api.following.value).toBe(true)
        expect(api.container.value?.scrollTop).toBe(200)
        scope.stop()
    })

    it('pauses when the user scrolls away and resumes explicitly', async () => {
        const items = ref<number[]>([1])
        const scope = effectScope()
        const api = scope.run(() => useFollowTail({ items, threshold: 8 }))!
        const element = mockElement()
        api.container.value = element
        element.scrollTop = 20
        api.onScroll()
        expect(api.following.value).toBe(false)
        items.value = [...items.value, 2]
        await nextTick()
        expect(element.scrollTop).toBe(20)
        api.resumeFollowing()
        await nextTick()
        expect(element.scrollTop).toBe(200)
        expect(api.following.value).toBe(true)
        scope.stop()
    })
})
