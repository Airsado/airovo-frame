import { describe, expect, it, vi } from "vitest";
import { ModalApi } from "./modal-api";
import { withFormCloseGuard } from "./form-close-guard";

describe("connected form dismissal", () => {
  it("continues editing on cancellation and discards only after confirmation", async () => {
    const form = { isDirty: true };
    const guarded = withFormCloseGuard({ form: () => form });
    const parent = new ModalApi(guarded.options).open();
    const dismiss = parent.close("escape");
    await Promise.resolve();
    expect(guarded.confirmation?.state.open).toBe(true);
    await guarded.confirmation!.cancel();
    await expect(dismiss).resolves.toBe(false);
    expect(parent.state.open).toBe(true);
    const retry = parent.close("close-button");
    await Promise.resolve();
    await guarded.confirmation!.confirm();
    await expect(retry).resolves.toBe(true);
  });

  it("does not prompt for pristine forms, successful saves or explicit API closes", async () => {
    for (const reason of ["escape", "confirm", "api"] as const) {
      const guarded = withFormCloseGuard({
        form: () => ({ isDirty: reason !== "escape" }),
      });
      const parent = new ModalApi(guarded.options).open();
      await expect(parent.close(reason)).resolves.toBe(true);
      expect(guarded.confirmation?.state.open).toBe(false);
    }
  });

  it("retains an existing close guard and isolates independent form instances", async () => {
    const beforeClose = vi.fn(() => false);
    const guarded = withFormCloseGuard({
      form: () => ({ isDirty: true }),
      onBeforeClose: beforeClose,
    });
    const blocked = new ModalApi(guarded.options).open();
    await expect(blocked.close("outside")).resolves.toBe(false);
    expect(beforeClose).toHaveBeenCalledOnce();
    expect(guarded.confirmation?.state.open).toBe(false);
    const other = withFormCloseGuard({ form: () => undefined });
    await expect(new ModalApi(other.options).open().cancel()).resolves.toBe(
      true,
    );
    expect(blocked.state.open).toBe(true);
  });

  it.each(["api", "confirm"] as const)(
    "allows %s closing to interrupt a pending discard confirmation",
    async (reason) => {
      const guarded = withFormCloseGuard({ form: () => ({ isDirty: true }) });
      const parent = new ModalApi(guarded.options).open();
      const dismiss = parent.close("escape");
      await Promise.resolve();
      expect(guarded.confirmation!.state.open).toBe(true);

      await expect(parent.close(reason)).resolves.toBe(true);
      await expect(dismiss).resolves.toBe(false);
      expect(guarded.confirmation!.state.open).toBe(false);
      expect(parent.state.open).toBe(false);
      await expect(parent.waitForResult()).resolves.toEqual({
        accepted: reason === "confirm",
        reason,
      });
    },
  );

  it("removes an old confirmation when the controller opens another record", async () => {
    const guarded = withFormCloseGuard<{ id: string }, unknown>({
      form: () => ({ isDirty: true }),
    });
    const parent = new ModalApi(guarded.options).open({ id: "old" });
    const dismiss = parent.close("outside");
    await Promise.resolve();
    expect(guarded.confirmation!.state.open).toBe(true);

    parent.open({ id: "new" });
    await expect(dismiss).resolves.toBe(false);
    expect(guarded.confirmation!.state.open).toBe(false);
    expect(parent.state.open).toBe(true);
    expect(parent.getData()).toEqual({ id: "new" });
    await expect(guarded.confirmation!.confirm()).resolves.toBe(false);
  });
});
