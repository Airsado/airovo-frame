import { ModalApi } from '../modal/modal-api'
import type { DrawerOptions } from './types'

/** Controller for framework drawers. It intentionally shares ModalApi's
 * typed payload/result and close-reason contract. */
export class DrawerApi<TData = unknown, TResult = unknown> extends ModalApi<TData, TResult> {
    constructor(options: DrawerOptions<TData, TResult> = {}) {
        super(options)
    }
}
