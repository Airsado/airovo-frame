import { reactive, shallowRef } from "vue";
import type {
  ModalCloseReason,
  ModalOptions,
  ModalOutcome,
  ModalState,
} from "./types";

const DEFAULT_STATE: ModalState = {
  open: false,
  isOpen: false,
  title: "",
  description: "",
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
  cancelText: "取消",
  confirmText: "确认",
  confirmIcon: "lucide:check",
};

export class ModalApi<TData = unknown, TResult = unknown> {
  readonly state: ModalState;
  private readonly data = shallowRef<TData | undefined>(undefined);
  private readonly resultValue = shallowRef<TResult | undefined>(undefined);
  private readonly options: ModalOptions<TData, TResult>;
  private generation = 0;
  private pendingClose: Promise<boolean> | undefined;
  private pendingCloseController: AbortController | undefined;
  private pendingCloseReason: ModalCloseReason | undefined;
  private pendingConfirm: Promise<boolean> | undefined;
  private pendingCancel: Promise<boolean> | undefined;
  private resultPromise: Promise<ModalOutcome<TResult>> | undefined;
  private resolveResult: ((outcome: ModalOutcome<TResult>) => void) | undefined;
  private settledResult: ModalOutcome<TResult> | undefined;

  constructor(options: ModalOptions<TData, TResult> = {}) {
    const {
      onBeforeClose,
      onCancel,
      onConfirm,
      onOpenChange,
      onOpened,
      onClosed,
      ...initialState
    } = options;
    this.options = {
      onBeforeClose,
      onCancel,
      onConfirm,
      onOpenChange,
      onOpened,
      onClosed,
    };
    this.state = reactive({ ...DEFAULT_STATE, ...initialState });
  }

  open(data?: TData): this {
    // A close confirmation belongs to one record/open cycle only.
    this.pendingCloseController?.abort();
    if (this.state.open && !this.settledResult) {
      // Re-opening the same controller starts a new cycle. Resolve the
      // previous waiter as an external close instead of leaving it
      // pending forever.
      this.settleResult({ accepted: false, reason: "api" });
    }
    if (arguments.length > 0) this.setData(data as TData);
    this.generation += 1;
    this.pendingClose = undefined;
    this.pendingCloseController = undefined;
    this.pendingCloseReason = undefined;
    this.pendingConfirm = undefined;
    this.pendingCancel = undefined;
    this.resultValue.value = undefined;
    this.settledResult = undefined;
    this.resultPromise = new Promise<ModalOutcome<TResult>>((resolve) => {
      this.resolveResult = resolve;
    });
    this.setState({ open: true, loading: false, error: undefined });
    return this;
  }

  close(reason: ModalCloseReason = "api"): Promise<boolean> {
    if (!this.state.open) return Promise.resolve(false);
    if (this.state.loading && reason !== "api" && reason !== "confirm")
      return Promise.resolve(false);
    if (this.pendingClose) {
      const explicit = reason === "api" || reason === "confirm";
      const pendingExplicit =
        this.pendingCloseReason === "api" ||
        this.pendingCloseReason === "confirm";
      if (!explicit || pendingExplicit) return this.pendingClose;
      // Saving or losing permission must not remain blocked behind a
      // user-dismissal dialog. Cancel that guard before closing explicitly.
      this.pendingCloseController?.abort();
    }

    const generation = this.generation;
    const controller = new AbortController();
    this.pendingCloseController = controller;
    this.pendingCloseReason = reason;
    const operation = (async () => {
      try {
        if (
          (await this.options.onBeforeClose?.(
            reason,
            this,
            controller.signal,
          )) === false
        )
          return false;
      } catch (error) {
        if (
          !controller.signal.aborted &&
          generation === this.generation &&
          this.state.open
        )
          this.setError(error);
        return false;
      }
      if (
        controller.signal.aborted ||
        generation !== this.generation ||
        !this.state.open
      )
        return false;
      this.setState({ open: false, loading: false });
      const accepted = reason === "confirm";
      const outcome: ModalOutcome<TResult> = { accepted, reason };
      // A cancelled or externally closed child must never leak a stale
      // result back into its parent form.
      if (accepted)
        outcome.result = this.resultValue.value as TResult | undefined;
      this.settleResult(outcome);
      return true;
    })();
    this.pendingClose = operation;
    void operation.then(
      () => {
        if (this.pendingClose === operation) this.clearPendingClose();
      },
      () => {
        if (this.pendingClose === operation) this.clearPendingClose();
      },
    );
    return operation;
  }

  confirm(result?: TResult): Promise<boolean> {
    if (!this.state.open || this.state.confirmDisabled)
      return Promise.resolve(false);
    if (this.pendingConfirm) return this.pendingConfirm;
    if (this.state.loading) return Promise.resolve(false);

    const generation = this.generation;
    if (arguments.length > 0) this.resultValue.value = result;
    this.setState({ loading: true, error: undefined });
    const operation = (async () => {
      try {
        const callbackResult = await this.options.onConfirm?.(
          this.getData(),
          this,
        );
        // Callbacks belong to the cycle that started them. Reopening or
        // closing the host invalidates every subsequent state write.
        if (generation !== this.generation || !this.state.open) return false;
        if (callbackResult === false) return false;
        if (
          callbackResult !== undefined &&
          typeof callbackResult !== "boolean"
        ) {
          this.resultValue.value = callbackResult as TResult;
        }
        return this.state.closeOnConfirm ? this.close("confirm") : true;
      } catch (error) {
        if (generation === this.generation && this.state.open)
          this.setError(error);
        throw error;
      } finally {
        if (generation === this.generation) this.state.loading = false;
      }
    })();
    this.pendingConfirm = operation;
    void operation.then(
      () => {
        if (this.pendingConfirm === operation) this.pendingConfirm = undefined;
      },
      () => {
        if (this.pendingConfirm === operation) this.pendingConfirm = undefined;
      },
    );
    return operation;
  }

  cancel(): Promise<boolean> {
    if (!this.state.open || this.state.loading) return Promise.resolve(false);
    if (this.pendingCancel) return this.pendingCancel;
    const generation = this.generation;
    const operation = (async () => {
      try {
        if ((await this.options.onCancel?.(this)) === false) return false;
        if (generation !== this.generation || !this.state.open) return false;
        return this.state.closeOnCancel ? this.close("cancel") : true;
      } catch (error) {
        if (generation === this.generation && this.state.open)
          this.setError(error);
        throw error;
      }
    })();
    this.pendingCancel = operation;
    void operation.then(
      () => {
        if (this.pendingCancel === operation) this.pendingCancel = undefined;
      },
      () => {
        if (this.pendingCancel === operation) this.pendingCancel = undefined;
      },
    );
    return operation;
  }

  setState(
    stateOrUpdate:
      | Partial<ModalState>
      | ((previous: Readonly<ModalState>) => Partial<ModalState>),
  ): this {
    const next =
      typeof stateOrUpdate === "function"
        ? stateOrUpdate({ ...this.state })
        : stateOrUpdate;
    const wasOpen = this.state.open;
    const nextOpen = "isOpen" in next ? next.isOpen : next.open;
    const rest = { ...next };
    delete rest.open;
    delete rest.isOpen;
    Object.assign(this.state, rest);
    if (nextOpen !== undefined) {
      this.state.open = nextOpen;
      this.state.isOpen = nextOpen;
    } else {
      this.state.isOpen = this.state.open;
    }
    if (this.state.open !== wasOpen)
      this.options.onOpenChange?.(this.state.open, this);
    return this;
  }

  setData(data: TData): this {
    this.data.value = data;
    return this;
  }

  getData(): TData | undefined {
    return this.data.value;
  }

  /** Return the typed result recorded by `confirm(result)` or `resolve(result)`. */
  getResult(): TResult | undefined {
    return this.resultValue.value as TResult | undefined;
  }

  /** Alias useful when a child form wants to express an explicit result. */
  resolve(result: TResult): Promise<boolean> {
    return this.confirm(result);
  }

  /** Promise settled once the current open cycle closes. */
  waitForResult(): Promise<ModalOutcome<TResult>> {
    if (this.settledResult) return Promise.resolve(this.settledResult);
    if (this.resultPromise)
      return this.resultPromise as Promise<ModalOutcome<TResult>>;
    return Promise.resolve({ accepted: false, reason: "api" as const });
  }

  lock(value = true): this {
    this.state.loading = value;
    return this;
  }

  unlock(): this {
    return this.lock(false);
  }

  notifyOpened(): void {
    if (this.state.open) this.options.onOpened?.(this);
  }

  notifyClosed(): void {
    if (!this.state.open) this.options.onClosed?.(this);
  }

  private settleResult(outcome: ModalOutcome<TResult>): void {
    if (this.settledResult) return;
    this.settledResult = outcome;
    this.resolveResult?.(outcome);
    this.resolveResult = undefined;
  }

  private clearPendingClose(): void {
    this.pendingClose = undefined;
    this.pendingCloseController = undefined;
    this.pendingCloseReason = undefined;
  }

  private setError(error: unknown): void {
    this.state.error = error instanceof Error ? error.message : String(error);
  }
}
