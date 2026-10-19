import {
  defineComponent,
  Fragment,
  h,
  markRaw,
  onBeforeUnmount,
  type Component,
} from "vue";
import ModalHost from "./ModalHost.vue";
import { ModalApi } from "./modal-api";
import type { ModalOptions } from "./types";
import { withFormCloseGuard } from "./form-close-guard";

export function useModal<TData = unknown, TResult = unknown>(
  options: ModalOptions<TData, TResult> = {},
): readonly [Component, ModalApi<TData, TResult>] {
  const guarded = withFormCloseGuard(options);
  const api = new ModalApi<TData, TResult>(guarded.options);
  const Modal = markRaw(
    defineComponent({
      name: "FrameworkModal",
      inheritAttrs: false,
      setup(_, { attrs, slots }) {
        onBeforeUnmount(() => {
          void guarded.confirmation?.close();
        });
        return () =>
          h(Fragment, [
            h(ModalHost, { ...attrs, api }, slots),
            guarded.confirmation
              ? h(ModalHost, { api: guarded.confirmation })
              : null,
          ]);
      },
    }),
  );
  return [Modal, api] as const;
}
