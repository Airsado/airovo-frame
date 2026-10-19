// @vitest-environment happy-dom
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import { useDrawer } from "../drawer/use-drawer";
import { useModal } from "../modal/use-modal";
import { overlayStack } from "./overlay-stack";

function settle(delay = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function cleanup() {
  overlayStack.clear();
  document.body.innerHTML = "";
  document.body.style.overflow = "";
}

afterEach(cleanup);

describe("mounted overlay hosts", () => {
  it.each(["modal", "drawer"] as const)(
    "keeps one decorative %s confirm icon through loading and allows opting out",
    async (kind) => {
      let api!: ReturnType<typeof useModal>[1];
      const wrapper = mount(
        defineComponent({
          setup() {
            const [Host, controller] = (
              kind === "modal" ? useModal : useDrawer
            )({
              title: "Save settings",
              description: "Confirm icon lifecycle",
              confirmText: "保存",
            });
            api = controller;
            return () => h(Host, {}, { default: () => h("div", "Content") });
          },
        }),
        { attachTo: document.body },
      );
      api.open();
      await nextTick();
      await settle();
      const confirm = () =>
        [
          ...document.querySelectorAll<HTMLButtonElement>(
            '[data-slot="dialog-footer"] button',
          ),
        ].find((button) => button.textContent?.trim() === "保存")!;
      expect(confirm().querySelectorAll("svg")).toHaveLength(1);
      expect(
        confirm()
          .querySelector('[data-slot="button-icon"]')
          ?.getAttribute("aria-hidden"),
      ).toBe("true");

      api.setState({ loading: true });
      await nextTick();
      expect(confirm().disabled).toBe(true);
      expect(confirm().querySelectorAll("svg")).toHaveLength(1);
      expect(
        confirm().querySelector("svg")?.classList.contains("animate-spin"),
      ).toBe(true);

      api.setState({ loading: false, confirmIcon: "" });
      await nextTick();
      expect(confirm().disabled).toBe(false);
      expect(confirm().querySelector("svg")).toBeNull();
      expect(confirm().textContent?.trim()).toBe("保存");
      wrapper.unmount();
    },
  );

  it.each(["modal", "drawer"] as const)(
    "lets a %s consumer own body scrolling and hides an empty action footer",
    async (kind) => {
      let api!: ReturnType<typeof useModal>[1];
      const wrapper = mount(
        defineComponent({
          setup() {
            const [Host, controller] = (
              kind === "modal" ? useModal : useDrawer
            )({
              title: "Custom body",
              description: "Consumer-owned scrolling",
              bodyClass: "overflow-hidden p-0 sm:p-0",
              contentClass: "max-h-[90dvh] top-0",
              showCancel: false,
              showConfirm: false,
            });
            api = controller;
            return () =>
              h(
                Host,
                {},
                {
                  default: () => h("div", { "data-test-body": "" }, "Content"),
                },
              );
          },
        }),
        { attachTo: document.body },
      );
      api.open();
      await nextTick();
      await settle();
      const body = document.querySelector("[data-test-body]")!.parentElement!;
      expect(body.classList.contains("overflow-hidden")).toBe(true);
      expect(body.classList.contains("overflow-y-auto")).toBe(false);
      expect(body.classList.contains("p-0")).toBe(true);
      expect(body.classList.contains("px-4")).toBe(false);
      const dialog = document.querySelector('[role="dialog"]')!;
      expect(dialog.classList.contains("max-h-[90dvh]")).toBe(true);
      expect(
        dialog.classList.contains("max-h-[var(--framework-modal-max-height)]"),
      ).toBe(false);
      expect(dialog.classList.contains("top-0")).toBe(true);
      expect(
        dialog.classList.contains("top-[var(--framework-modal-top)]"),
      ).toBe(false);
      expect(document.querySelector('[data-slot="dialog-footer"]')).toBeNull();
      wrapper.unmount();
    },
  );

  it.each(["modal", "drawer"] as const)(
    "preserves a custom %s footer when standard actions are disabled",
    async (kind) => {
      let api!: ReturnType<typeof useModal>[1];
      const wrapper = mount(
        defineComponent({
          setup() {
            const [Host, controller] = (
              kind === "modal" ? useModal : useDrawer
            )({
              title: "Custom actions",
              description: "Consumer-owned footer",
              showCancel: false,
              showConfirm: false,
            });
            api = controller;
            return () =>
              h(
                Host,
                {},
                {
                  default: () => h("div", "Content"),
                  footer: () =>
                    h("button", { type: "button" }, "Custom action"),
                },
              );
          },
        }),
        { attachTo: document.body },
      );
      api.open();
      await nextTick();
      await settle();
      expect(
        document.querySelector('[data-slot="dialog-footer"]')?.textContent,
      ).toBe("Custom action");
      wrapper.unmount();
    },
  );

  it("closes only the top overlay on Escape and restores the parent layer", async () => {
    let drawerApi!: ReturnType<typeof useDrawer>[1];
    let modalApi!: ReturnType<typeof useModal>[1];

    const Root = defineComponent({
      setup() {
        const [Drawer, drawer] = useDrawer({
          title: "父抽屉",
          description: "父层说明",
        });
        const [Modal, modal] = useModal({
          title: "子弹窗",
          description: "子层说明",
        });
        drawerApi = drawer;
        modalApi = modal;
        return () =>
          h("div", [
            h(Drawer, {}, { default: () => h("div", "drawer body") }),
            h(Modal, {}, { default: () => h("div", "modal body") }),
          ]);
      },
    });

    const wrapper = mount(Root, { attachTo: document.body });
    drawerApi.open({ id: "drawer" });
    modalApi.open({ id: "modal" });
    await nextTick();
    await settle();

    expect(overlayStack.size).toBe(2);
    expect(document.body.style.overflow).toBe("hidden");

    const result = modalApi.waitForResult();
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );
    await nextTick();
    await settle();

    await expect(result).resolves.toMatchObject({
      accepted: false,
      reason: "escape",
    });
    expect(modalApi.state.open).toBe(false);
    expect(drawerApi.state.open).toBe(true);
    expect(overlayStack.size).toBe(1);
    expect(document.body.style.overflow).toBe("hidden");

    await drawerApi.close("api");
    await nextTick();
    await settle();
    expect(overlayStack.size).toBe(0);
    wrapper.unmount();
    await nextTick();
    await settle(250);
    expect(overlayStack.bodyLockCount).toBe(0);
    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.pointerEvents).toBe("");
  });

  it("routes the close button through the typed outcome contract", async () => {
    let api!: ReturnType<typeof useModal>[1];
    const Root = defineComponent({
      setup() {
        const [Modal, modal] = useModal({
          title: "关闭测试",
          description: "关闭说明",
        });
        api = modal;
        return () => h(Modal, {}, { default: () => h("div", "body") });
      },
    });

    const wrapper: VueWrapper = mount(Root, { attachTo: document.body });
    api.open();
    await nextTick();
    await settle();

    const result = api.waitForResult();
    const closeButton = document.querySelector<HTMLButtonElement>(
      'button[aria-label="关闭对话框"]',
    );
    expect(closeButton).toBeTruthy();
    closeButton?.click();
    await nextTick();
    await settle();

    await expect(result).resolves.toMatchObject({
      accepted: false,
      reason: "close-button",
    });
    expect(api.state.open).toBe(false);
    wrapper.unmount();
  });

  it("routes an outside pointer interaction to the top modal only", async () => {
    let api!: ReturnType<typeof useModal>[1];
    const Root = defineComponent({
      setup() {
        const [Modal, modal] = useModal({
          title: "外部关闭",
          description: "外部关闭说明",
        });
        api = modal;
        return () => h(Modal, {}, { default: () => h("div", "body") });
      },
    });

    const wrapper = mount(Root, { attachTo: document.body });
    api.open();
    await nextTick();
    await settle();

    const result = api.waitForResult();
    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    await nextTick();
    await settle();

    await expect(result).resolves.toMatchObject({
      accepted: false,
      reason: "outside",
    });
    expect(api.state.open).toBe(false);
    wrapper.unmount();
  });

  it("keeps the parent form layer open when a child confirmation fails", async () => {
    let parentApi!: ReturnType<typeof useDrawer>[1];
    let childApi!: ReturnType<typeof useModal>[1];
    const Root = defineComponent({
      setup() {
        const [Drawer, drawer] = useDrawer({
          title: "父表单",
          description: "父表单说明",
        });
        const [Modal, modal] = useModal({
          title: "子表单",
          description: "子表单说明",
          onConfirm: async () => {
            throw new Error("校验失败");
          },
        });
        parentApi = drawer;
        childApi = modal;
        return () =>
          h("div", [
            h(Drawer, {}, { default: () => h("div", "parent") }),
            h(Modal, {}, { default: () => h("div", "child") }),
          ]);
      },
    });

    const wrapper = mount(Root, { attachTo: document.body });
    parentApi.open();
    childApi.open();
    await nextTick();
    await settle();

    await expect(childApi.confirm({ saved: true })).rejects.toThrow("校验失败");
    expect(childApi.state.open).toBe(true);
    expect(parentApi.state.open).toBe(true);
    expect(overlayStack.size).toBe(2);
    wrapper.unmount();
  });
});
