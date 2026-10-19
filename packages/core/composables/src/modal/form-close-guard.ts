import { ModalApi } from "./modal-api";
import type { ModalOptions } from "./types";

/** Keep form state owned by the form; the overlay only asks before discarding it. */
export function withFormCloseGuard<TData, TResult>(
  options: ModalOptions<TData, TResult>,
) {
  const { form, ...rest } = options;
  if (!form) return { options: rest, confirmation: undefined };

  const confirmation = new ModalApi({
    title: "放弃未保存的修改？",
    description: "修改尚未保存。你可以继续编辑，或放弃修改并关闭。",
    cancelText: "继续编辑",
    confirmText: "放弃修改",
    contentClass: "sm:max-w-md",
  });
  return {
    confirmation,
    options: {
      ...rest,
      onBeforeClose: async (reason, api, signal) => {
        if (
          (await rest.onBeforeClose?.(reason, api, signal)) === false ||
          signal.aborted
        )
          return false;
        // Explicit API closes also serve successful saves and permission loss.
        // User dismissals always pass their specific reason through the host.
        if (reason === "confirm" || reason === "api" || !form()?.isDirty)
          return true;
        const abort = () => {
          void confirmation.close("api");
        };
        signal.addEventListener("abort", abort, { once: true });
        try {
          confirmation.open();
          return (
            (await confirmation.waitForResult()).accepted && !signal.aborted
          );
        } finally {
          signal.removeEventListener("abort", abort);
        }
      },
    } satisfies ModalOptions<TData, TResult>,
  };
}
