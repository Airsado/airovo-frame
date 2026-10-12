import type { ModalApi } from './modal-api'

export type ModalCloseReason = 'api' | 'cancel' | 'confirm' | 'escape' | 'outside' | 'close-button'

export interface ModalOutcome<TResult = unknown> {
    accepted: boolean
    reason: ModalCloseReason
    result?: TResult
}

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
    contentHeight?: string | number
    headerClass?: string
    titleClass?: string
    descriptionClass?: string
    bodyClass?: string
    footerClass?: string
    error?: string
}

export interface ModalOptions<TData = unknown, TResult = unknown> extends Partial<Omit<ModalState, 'open' | 'isOpen' | 'error'>> {
    onBeforeClose?: (reason: ModalCloseReason, api: ModalApi<TData, TResult>) => boolean | void | Promise<boolean | void>
    onCancel?: (api: ModalApi<TData, TResult>) => boolean | void | Promise<boolean | void>
    onConfirm?: (data: TData | undefined, api: ModalApi<TData, TResult>) => boolean | TResult | void | Promise<boolean | TResult | void>
    onOpenChange?: (open: boolean, api: ModalApi<TData, TResult>) => void
    onOpened?: (api: ModalApi<TData, TResult>) => void
    onClosed?: (api: ModalApi<TData, TResult>) => void
}
