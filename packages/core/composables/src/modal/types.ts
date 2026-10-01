import type { ModalApi } from './modal-api'

export type ModalCloseReason = 'api' | 'cancel' | 'confirm' | 'escape' | 'outside' | 'close-button'

export interface ModalState {
    open: boolean
    /** vben-compatible alias for `open`. */
    isOpen: boolean
    title: string
    description: string
    loading: boolean
    footer: boolean
    showCancel: boolean
    showConfirm: boolean
    showCloseButton: boolean
    closeOnEscape: boolean
    closeOnOutside: boolean
    closeOnConfirm: boolean
    closeOnCancel: boolean
    confirmDisabled: boolean
    cancelText: string
    confirmText: string
    contentClass?: string
    error?: string
}

export interface ModalOptions<TData = unknown> extends Partial<Omit<ModalState, 'open' | 'isOpen' | 'error'>> {
    onBeforeClose?: (reason: ModalCloseReason, api: ModalApi<TData>) => boolean | void | Promise<boolean | void>
    onCancel?: (api: ModalApi<TData>) => boolean | void | Promise<boolean | void>
    onConfirm?: (data: TData | undefined, api: ModalApi<TData>) => boolean | void | Promise<boolean | void>
    onOpenChange?: (open: boolean, api: ModalApi<TData>) => void
    onOpened?: (api: ModalApi<TData>) => void
    onClosed?: (api: ModalApi<TData>) => void
}
