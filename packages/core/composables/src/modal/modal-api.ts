import { reactive, shallowRef } from 'vue'
import type { ModalCloseReason, ModalOptions, ModalState } from './types'

const DEFAULT_STATE: ModalState = {
    open: false,
    isOpen: false,
    title: '',
    description: '',
    loading: false,
    footer: true,
    showCancel: true,
    showConfirm: true,
    showCloseButton: true,
    closeOnEscape: true,
    closeOnOutside: true,
    closeOnConfirm: true,
    closeOnCancel: true,
    confirmDisabled: false,
    cancelText: '取消',
    confirmText: '确认',
}

export class ModalApi<TData = unknown> {
    readonly state: ModalState
    private readonly data = shallowRef<TData | undefined>(undefined)
    private readonly options: ModalOptions<TData>
    private generation = 0
    private pendingClose: Promise<boolean> | undefined
    private pendingConfirm: Promise<boolean> | undefined
    private pendingCancel: Promise<boolean> | undefined

    constructor(options: ModalOptions<TData> = {}) {
        const { onBeforeClose, onCancel, onConfirm, onOpenChange, onOpened, onClosed, ...initialState } = options
        this.options = { onBeforeClose, onCancel, onConfirm, onOpenChange, onOpened, onClosed }
        this.state = reactive({ ...DEFAULT_STATE, ...initialState })
    }

    open(data?: TData): this {
        if (arguments.length > 0) this.setData(data as TData)
        this.generation += 1
        this.pendingClose = undefined
        this.pendingConfirm = undefined
        this.pendingCancel = undefined
        this.setState({ open: true, loading: false, error: undefined })
        return this
    }

    close(reason: ModalCloseReason = 'api'): Promise<boolean> {
        if (!this.state.open) return Promise.resolve(false)
        if (this.state.loading && reason !== 'api' && reason !== 'confirm') return Promise.resolve(false)
        if (this.pendingClose) return this.pendingClose

        const generation = this.generation
        const operation = (async () => {
            try {
                if (await this.options.onBeforeClose?.(reason, this) === false) return false
            } catch (error) {
                this.setError(error)
                return false
            }
            if (generation !== this.generation || !this.state.open) return false
            this.setState({ open: false, loading: false })
            return true
        })()
        this.pendingClose = operation
        void operation.then(() => {
            if (this.pendingClose === operation) this.pendingClose = undefined
        }, () => {
            if (this.pendingClose === operation) this.pendingClose = undefined
        })
        return operation
    }

    confirm(): Promise<boolean> {
        if (!this.state.open || this.state.confirmDisabled) return Promise.resolve(false)
        if (this.pendingConfirm) return this.pendingConfirm
        if (this.state.loading) return Promise.resolve(false)

        const generation = this.generation
        this.setState({ loading: true, error: undefined })
        const operation = (async () => {
            try {
                if (await this.options.onConfirm?.(this.getData(), this) === false) return false
                if (generation !== this.generation || !this.state.open) return false
                return this.state.closeOnConfirm ? this.close('confirm') : true
            } catch (error) {
                this.setError(error)
                throw error
            } finally {
                if (generation === this.generation) this.state.loading = false
            }
        })()
        this.pendingConfirm = operation
        void operation.then(() => {
            if (this.pendingConfirm === operation) this.pendingConfirm = undefined
        }, () => {
            if (this.pendingConfirm === operation) this.pendingConfirm = undefined
        })
        return operation
    }

    cancel(): Promise<boolean> {
        if (!this.state.open || this.state.loading) return Promise.resolve(false)
        if (this.pendingCancel) return this.pendingCancel
        const generation = this.generation
        const operation = (async () => {
            try {
                if (await this.options.onCancel?.(this) === false) return false
                if (generation !== this.generation || !this.state.open) return false
                return this.state.closeOnCancel ? this.close('cancel') : true
            } catch (error) {
                this.setError(error)
                throw error
            }
        })()
        this.pendingCancel = operation
        void operation.then(() => {
            if (this.pendingCancel === operation) this.pendingCancel = undefined
        }, () => {
            if (this.pendingCancel === operation) this.pendingCancel = undefined
        })
        return operation
    }

    setState(stateOrUpdate: Partial<ModalState> | ((previous: Readonly<ModalState>) => Partial<ModalState>)): this {
        const next = typeof stateOrUpdate === 'function' ? stateOrUpdate({ ...this.state }) : stateOrUpdate
        const wasOpen = this.state.open
        const nextOpen = 'isOpen' in next ? next.isOpen : next.open
        const rest = { ...next }
        delete rest.open
        delete rest.isOpen
        Object.assign(this.state, rest)
        if (nextOpen !== undefined) {
            this.state.open = nextOpen
            this.state.isOpen = nextOpen
        } else {
            this.state.isOpen = this.state.open
        }
        if (this.state.open !== wasOpen) this.options.onOpenChange?.(this.state.open, this)
        return this
    }

    setData(data: TData): this {
        this.data.value = data
        return this
    }

    getData(): TData | undefined {
        return this.data.value
    }

    lock(value = true): this {
        this.state.loading = value
        return this
    }

    unlock(): this {
        return this.lock(false)
    }

    notifyOpened(): void {
        if (this.state.open) this.options.onOpened?.(this)
    }

    notifyClosed(): void {
        if (!this.state.open) this.options.onClosed?.(this)
    }

    private setError(error: unknown): void {
        this.state.error = error instanceof Error ? error.message : String(error)
    }
}
