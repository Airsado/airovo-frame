import { ref, type Ref } from 'vue'

/**
 * Options for an entry in the framework overlay stack.
 *
 * The stack does not know how an overlay is rendered. It only coordinates
 * ordering, dismissal ownership and the shared document scroll lock.
 */
export interface OverlayEntryOptions {
    lockBodyScroll?: boolean
    /** Restore the opener focus when this entry is released. */
    restoreFocus?: boolean
    onEscape?: (event?: KeyboardEvent) => boolean | void
    onOutside?: (event?: Event) => boolean | void
}

export interface OverlayStackOptions {
    /** The first overlay layer's backdrop z-index. */
    baseZIndex?: number
    /** The gap reserved for each subsequent overlay layer. */
    zIndexStep?: number
    /** Whether entries lock body scrolling by default. */
    lockBodyScroll?: boolean
}

export interface OverlayHandle {
    readonly id: number
    readonly zIndex: Readonly<Ref<number>>
    readonly overlayZIndex: Readonly<Ref<number>>
    readonly isReleased: Readonly<Ref<boolean>>
    /** Whether this entry is currently the topmost live overlay. */
    isTop(): boolean
    /** Ask the topmost overlay to handle Escape. Lower layers never receive it. */
    tryEscape(event?: KeyboardEvent): boolean
    /** Ask the topmost overlay to handle an outside interaction. */
    tryOutside(event?: Event): boolean
    /** Remove this entry. Releasing an entry more than once is safe. */
    release(): void
    /** Restore the element that owned focus when this entry was acquired. */
    restoreFocus(): void
}

interface OverlayEntry {
    id: number
    zIndex: number
    overlayZIndex: number
    lockBodyScroll: boolean
    restoreFocus: boolean
    opener: HTMLElement | null
    options: OverlayEntryOptions
    released: boolean
    release?: () => void
}

const DEFAULT_BASE_Z_INDEX = 1000
const DEFAULT_Z_INDEX_STEP = 20

/**
 * Coordinates framework overlays without coupling them to a specific UI
 * primitive. Modal, Drawer and future overlay hosts can all use this manager.
 */
export class OverlayStack {
    private readonly baseZIndex: number
    private readonly zIndexStep: number
    private readonly defaultLockBodyScroll: boolean
    private readonly entries = new Map<number, OverlayEntry>()
    private nextId = 0
    private bodyLockCountValue = 0
    private previousBodyOverflow: string | undefined

    constructor(options: OverlayStackOptions = {}) {
        this.baseZIndex = options.baseZIndex ?? DEFAULT_BASE_Z_INDEX
        this.zIndexStep = options.zIndexStep ?? DEFAULT_Z_INDEX_STEP
        this.defaultLockBodyScroll = options.lockBodyScroll ?? true
    }

    get size(): number {
        return this.entries.size
    }

    get bodyLockCount(): number {
        return this.bodyLockCountValue
    }

    get isBodyLocked(): boolean {
        return this.bodyLockCountValue > 0
    }

    acquire(options: OverlayEntryOptions = {}): OverlayHandle {
        const id = ++this.nextId
        const overlayZIndex = this.baseZIndex + (id - 1) * this.zIndexStep
        const entry: OverlayEntry = {
            id,
            overlayZIndex,
            zIndex: overlayZIndex + 1,
            lockBodyScroll: options.lockBodyScroll ?? this.defaultLockBodyScroll,
            restoreFocus: options.restoreFocus ?? true,
            opener: this.getActiveElement(),
            options,
            released: false,
        }
        this.entries.set(id, entry)
        if (entry.lockBodyScroll) this.lockBody()

        const zIndex = ref(entry.zIndex)
        const overlayLayer = ref(entry.overlayZIndex)
        const isReleased = ref(false)
        const release = () => {
            if (entry.released) return
            entry.released = true
            isReleased.value = true
            this.entries.delete(entry.id)
            if (entry.lockBodyScroll) this.unlockBody()
            if (entry.restoreFocus) this.restoreFocus(entry.opener)
        }
        entry.release = release

        return {
            id,
            zIndex,
            overlayZIndex: overlayLayer,
            isReleased,
            isTop: () => this.isTop(entry.id),
            tryEscape: (event) => this.isTop(entry.id) && this.dispatchEscape(event),
            tryOutside: (event) => this.isTop(entry.id) && this.dispatchOutside(event),
            release,
            restoreFocus: () => this.restoreFocus(entry.opener),
        }
    }

    /** Returns whether a live entry is the highest layer. */
    isTop(handleOrId: OverlayHandle | number): boolean {
        const id = typeof handleOrId === 'number' ? handleOrId : handleOrId.id
        const entry = this.entries.get(id)
        return Boolean(entry && !entry.released && this.getTopEntry()?.id === id)
    }

    /** Dispatch Escape to the top layer only. Returns true when it handled it. */
    dispatchEscape(event?: KeyboardEvent): boolean {
        const entry = this.getTopEntry()
        if (!entry || !entry.options.onEscape) return false
        return entry.options.onEscape(event) !== false
    }

    /** Dispatch an outside interaction to the top layer only. */
    dispatchOutside(event?: Event): boolean {
        const entry = this.getTopEntry()
        if (!entry || !entry.options.onOutside) return false
        return entry.options.onOutside(event) !== false
    }

    /** Release every entry and restore the body's previous overflow value. */
    clear(): void {
        const topId = this.getTopEntry()?.id
        for (const entry of [...this.entries.values()]) {
            if (entry.id !== topId) entry.restoreFocus = false
            entry.release?.()
        }
    }

    private getTopEntry(): OverlayEntry | undefined {
        let top: OverlayEntry | undefined
        for (const entry of this.entries.values()) {
            if (!entry.released && (!top || entry.id > top.id)) top = entry
        }
        return top
    }

    private getActiveElement(): HTMLElement | null {
        if (typeof document === 'undefined') return null
        const element = document.activeElement
        return element instanceof HTMLElement && element !== document.body ? element : null
    }

    private lockBody(): void {
        this.bodyLockCountValue += 1
        if (this.bodyLockCountValue !== 1) return
        const body = typeof document === 'undefined' ? undefined : document.body
        if (!body) return
        this.previousBodyOverflow = body.style.overflow
        body.style.overflow = 'hidden'
    }

    private unlockBody(): void {
        if (this.bodyLockCountValue === 0) return
        this.bodyLockCountValue -= 1
        if (this.bodyLockCountValue !== 0) return
        const body = typeof document === 'undefined' ? undefined : document.body
        if (body) body.style.overflow = this.previousBodyOverflow ?? ''
        this.previousBodyOverflow = undefined
    }

    private restoreFocus(element: HTMLElement | null): void {
        if (!element || !element.isConnected || typeof element.focus !== 'function') return
        try {
            element.focus({ preventScroll: true })
        } catch {
            element.focus()
        }
    }
}

/** Shared manager used by framework overlay hosts. */
export const overlayStack = new OverlayStack()

export { DEFAULT_BASE_Z_INDEX, DEFAULT_Z_INDEX_STEP }
