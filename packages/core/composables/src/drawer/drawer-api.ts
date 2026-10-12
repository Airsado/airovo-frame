import { ModalApi } from '../modal/modal-api'
import type { DrawerOptions, DrawerSide } from './types'

/** Controller for framework drawers. It intentionally shares ModalApi's
 * typed payload/result and close-reason contract. */
export class DrawerApi<TData = unknown, TResult = unknown> extends ModalApi<TData, TResult> {
    readonly side: DrawerSide

    constructor(options: DrawerOptions<TData, TResult> = {}) {
        const { side = 'bottom', ...modalOptions } = options
        super(modalOptions)
        this.side = side
    }
}
