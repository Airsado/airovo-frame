import {
  defineComponent,
  Fragment,
  h,
  markRaw,
  onBeforeUnmount,
  type Component,
} from "vue";
import DrawerHost from "./DrawerHost.vue";
import { DrawerApi } from "./drawer-api";
import type { DrawerOptions } from "./types";
import ModalHost from "../modal/ModalHost.vue";
import { withFormCloseGuard } from "../modal/form-close-guard";

export function useDrawer<TData = unknown, TResult = unknown>(
  options: DrawerOptions<TData, TResult> = {},
): readonly [Component, DrawerApi<TData, TResult>] {
  const { side, ...modalOptions } = options;
  const guarded = withFormCloseGuard(modalOptions);
  const api = new DrawerApi<TData, TResult>({ ...guarded.options, side });
  const Drawer = markRaw(
    defineComponent({
      name: "FrameworkDrawer",
      inheritAttrs: false,
      setup(_, { attrs, slots }) {
        onBeforeUnmount(() => {
          void guarded.confirmation?.close();
        });
        return () =>
          h(Fragment, [
            h(DrawerHost, { ...attrs, api }, slots),
            guarded.confirmation
              ? h(ModalHost, { api: guarded.confirmation })
              : null,
          ]);
      },
    }),
  );
  return [Drawer, api] as const;
}
