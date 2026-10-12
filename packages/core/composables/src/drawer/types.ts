import type { ModalCloseReason, ModalOptions, ModalOutcome, ModalState } from '../modal/types'
import type { DrawerApi } from './drawer-api'

/** The edge from which a framework drawer enters the viewport. */
export type DrawerSide = 'bottom' | 'right'

export type DrawerCloseReason = ModalCloseReason
export type DrawerOutcome<TResult = unknown> = ModalOutcome<TResult>
export type DrawerState = ModalState
export type DrawerOptions<TData = unknown, TResult = unknown> = ModalOptions<TData, TResult> & {
    /** Defaults to the bottom sheet used by existing callers. */
    side?: DrawerSide
}
export type DrawerController<TData = unknown, TResult = unknown> = DrawerApi<TData, TResult>
