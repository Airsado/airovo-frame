import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModalApi } from "./modal-api";

describe("ModalApi", () => {
  let api: ModalApi<{ id: string }>;

  beforeEach(() => {
    api = new ModalApi<{ id: string }>({ title: "编辑记录" });
  });

  it("opens with payload and mirrors the open aliases", () => {
    const onOpenChange = vi.fn();
    api = new ModalApi({ onOpenChange });
    api.open({ id: "a" });

    expect(api.state.open).toBe(true);
    expect(api.state.isOpen).toBe(true);
    expect(api.getData()).toEqual({ id: "a" });
    expect(onOpenChange).toHaveBeenCalledWith(true, api);
  });

  it("supports object and updater state changes", () => {
    api.setState({ title: "新标题" });
    api.setState((previous) => ({ description: `${previous.title}说明` }));

    expect(api.state.title).toBe("新标题");
    expect(api.state.description).toBe("新标题说明");
  });

  it("keeps layout customization options in modal state", () => {
    api = new ModalApi({
      contentHeight: 480,
      initialFocus: "#first-input",
      headerClass: "header",
      titleClass: "title",
      descriptionClass: "description",
      bodyClass: "body",
      footerClass: "footer",
    });
    expect(api.state.contentHeight).toBe(480);
    expect(api.state.initialFocus).toBe("#first-input");
    expect(api.state.headerClass).toBe("header");
    expect(api.state.titleClass).toBe("title");
    expect(api.state.descriptionClass).toBe("description");
    expect(api.state.bodyClass).toBe("body");
    expect(api.state.footerClass).toBe("footer");
  });

  it("honors an async before-close guard", async () => {
    const onBeforeClose = vi.fn(async () => false);
    api = new ModalApi({ onBeforeClose });
    api.open();

    await expect(api.close("escape")).resolves.toBe(false);
    expect(api.state.open).toBe(true);
    expect(onBeforeClose).toHaveBeenCalledWith(
      "escape",
      api,
      expect.any(AbortSignal),
    );
  });

  it("deduplicates async confirm and clears loading after success", async () => {
    let resolve!: () => void;
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    api = new ModalApi({ onConfirm });
    api.open({ id: "a" });

    const first = api.confirm();
    const second = api.confirm();
    expect(first).toBe(second);
    expect(api.state.loading).toBe(true);
    resolve();
    await expect(first).resolves.toBe(true);
    expect(onConfirm).toHaveBeenCalledWith({ id: "a" }, api);
    expect(api.state.loading).toBe(false);
    expect(api.state.open).toBe(false);
  });

  it("keeps the modal open when async confirmation fails", async () => {
    api = new ModalApi({
      onConfirm: async () => {
        throw new Error("保存失败");
      },
    });
    api.open();

    await expect(api.confirm()).rejects.toThrow("保存失败");
    expect(api.state.open).toBe(true);
    expect(api.state.loading).toBe(false);
    expect(api.state.error).toBe("保存失败");
  });

  it("can keep the modal open after confirm and cancel handlers", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    api = new ModalApi({
      onConfirm,
      onCancel,
      closeOnConfirm: false,
      closeOnCancel: false,
    });
    api.open();

    await api.confirm();
    await api.cancel();

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
    expect(api.state.open).toBe(true);
  });

  it("returns a typed outcome after a child confirms", async () => {
    const typedApi = new ModalApi<{ id: string }, { saved: boolean }>();
    typedApi.open({ id: "a" });

    const outcomePromise = typedApi.waitForResult();
    await expect(typedApi.confirm({ saved: true })).resolves.toBe(true);
    await expect(outcomePromise).resolves.toEqual({
      accepted: true,
      reason: "confirm",
      result: { saved: true },
    });
    expect(typedApi.getResult()).toEqual({ saved: true });
  });

  it("does not return a child result when the modal is cancelled", async () => {
    const typedApi = new ModalApi<undefined, { saved: boolean }>();
    typedApi.open();

    const outcomePromise = typedApi.waitForResult();
    await expect(typedApi.cancel()).resolves.toBe(true);
    await expect(outcomePromise).resolves.toEqual({
      accepted: false,
      reason: "cancel",
    });
  });

  it("locks interaction until unlocked", async () => {
    api.open();
    api.lock();

    expect(await api.cancel()).toBe(false);
    expect(await api.close("outside")).toBe(false);
    api.unlock();
    expect(await api.close()).toBe(true);
  });
});
