import { inject, provide, type InjectionKey, type Ref } from 'vue'

/**
 * Neutral ownership contract for body-portalled framework controls. Keeping
 * it separate from Modal/Drawer and UI primitives avoids a dependency cycle.
 */
export interface OverlayOwner {
    /** False when the host closes or another main overlay covers it. */
    readonly active: Readonly<Ref<boolean>>
    /** Reserved above this host's content, below the next host's backdrop. */
    readonly popupZIndex: Readonly<Ref<number | undefined>>
}

const OVERLAY_OWNER: InjectionKey<OverlayOwner> = Symbol('overlay-owner')

export function provideOverlayOwner(owner: OverlayOwner): void {
    provide(OVERLAY_OWNER, owner)
}

export function useOverlayOwner(): OverlayOwner | undefined {
    return inject(OVERLAY_OWNER, undefined)
}
