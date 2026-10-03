import type { ModalCloseReason, ModalOptions, ModalOutcome, ModalState } from '../modal/types'
import type { DrawerApi } from './drawer-api'

export type DrawerCloseReason = ModalCloseReason
export type DrawerOutcome<TResult = unknown> = ModalOutcome<TResult>
export type DrawerState = ModalState
export type DrawerOptions<TData = unknown, TResult = unknown> = ModalOptions<TData, TResult>
export type DrawerController<TData = unknown, TResult = unknown> = DrawerApi<TData, TResult>
