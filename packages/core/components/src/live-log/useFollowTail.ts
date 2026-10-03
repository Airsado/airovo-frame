import { computed, getCurrentInstance, nextTick, onMounted, ref, shallowRef, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'

export interface UseFollowTailOptions {
    /** The collection (or count) whose additions should follow the tail. */
    items?: MaybeRefOrGetter<readonly unknown[] | number>
    /** Distance from the bottom at which the view is considered at the tail. */
    threshold?: number
    /** Start following new items. Defaults to true. */
    initialFollowing?: boolean
}

export interface UseFollowTailReturn {
    container: Ref<HTMLElement | null>
    following: Ref<boolean>
    atTail: Readonly<Ref<boolean>>
    onScroll: () => void
    scrollToTail: (behavior?: ScrollBehavior) => void
    pauseFollowing: () => void
    resumeFollowing: () => void
}

function itemCount(value: readonly unknown[] | number | undefined): number {
    return Array.isArray(value) ? value.length : Number(value ?? 0)
}

/** Owns only the DOM side of a live log; transport/session code stays separate. */
export function useFollowTail(
    options: UseFollowTailOptions = {},
): UseFollowTailReturn {
    const container = shallowRef<HTMLElement | null>(null)
    const following = ref(options.initialFollowing !== false)
    const atTail = ref(true)
    const threshold = Math.max(0, options.threshold ?? 24)

    function distanceFromTail(): number {
        const element = container.value
        return element ? Math.max(0, element.scrollHeight - element.scrollTop - element.clientHeight) : 0
    }

    function updateTailState(): void {
        const atBottom = distanceFromTail() <= threshold
        atTail.value = atBottom
        if (!atBottom) following.value = false
    }

    function scrollToTail(behavior: ScrollBehavior = 'auto'): void {
        const element = container.value
        if (!element) return
        element.scrollTo({ top: element.scrollHeight, behavior })
        atTail.value = true
    }

    function pauseFollowing(): void {
        following.value = false
    }

    function resumeFollowing(): void {
        following.value = true
        void nextTick(() => scrollToTail('smooth'))
    }

    function onScroll(): void {
        updateTailState()
    }

    const sourceCount = computed(() => itemCount(toValue(options.items)))
    watch(sourceCount, () => {
        if (!following.value) return
        scrollToTail()
    }, { flush: 'post' })

    if (getCurrentInstance()) {
        onMounted(() => {
            if (following.value) void nextTick(() => scrollToTail())
        })
    }

    return {
        container,
        following,
        atTail,
        onScroll,
        scrollToTail,
        pauseFollowing,
        resumeFollowing,
    }
}
