// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref, type Ref } from "vue";
import { createI18n } from "vue-i18n";
import { afterEach, describe, expect, it, vi } from "vitest";
import DataTablePagination from "../../../components/src/data-table/DataTablePagination.vue";
import { useDrawer } from "../drawer/use-drawer";
import { useModal } from "../modal/use-modal";
import { overlayStack } from "./overlay-stack";

const wrappers: VueWrapper[] = [];

async function settle() {
  await nextTick();
  await flushPromises();
  await new Promise<void>((resolve) => setTimeout(resolve, 10));
}

afterEach(async () => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  await settle();
  overlayStack.clear();
  document.body.innerHTML = "";
  document.body.style.overflow = "";
  document.body.style.pointerEvents = "";
});

function attach(component: ReturnType<typeof defineComponent>) {
  const wrapper = mount(component, {
    attachTo: document.body,
    global: {
      plugins: [createI18n({ legacy: false, locale: "zh-CN", messages: {} })],
    },
  });
  wrappers.push(wrapper);
  return wrapper;
}

function pagination(pageSize: Ref<number>) {
  return h(DataTablePagination, {
    page: 1,
    pageSize: pageSize.value,
    total: 120,
    pageSizeOptions: [10, 20, 50],
    "onUpdate:pageSize": (value: number) => {
      pageSize.value = value;
    },
  });
}

async function openPageSize() {
  const trigger =
    document.querySelector<HTMLButtonElement>('[role="combobox"]');
  expect(trigger).toBeTruthy();
  trigger!.focus();
  trigger!.dispatchEvent(
    new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
  );
  await settle();
  const popup = document.querySelector<HTMLElement>('[role="listbox"]');
  expect(popup).toBeTruthy();
  return { trigger: trigger!, popup: popup! };
}

async function selectPageSize(popup: HTMLElement, value: number) {
  const option = [
    ...popup.querySelectorAll<HTMLElement>('[role="option"]'),
  ].find((item) => item.textContent?.trim() === String(value));
  expect(option).toBeTruthy();
  option!.dispatchEvent(
    new PointerEvent("pointerup", { bubbles: true, pointerType: "touch" }),
  );
  await settle();
}

function escape() {
  document.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    }),
  );
}

describe("Data-table page-size popups in framework overlay hosts", () => {
  it("keeps standalone pagination on the primitive layer and updates the page size", async () => {
    const pageSize = ref(10);
    attach(defineComponent({ setup: () => () => pagination(pageSize) }));
    await settle();
    const { popup, trigger } = await openPageSize();

    // An ordinary page must not acquire a modal layer just to open its menu.
    expect(popup.style.zIndex).toBe("");
    expect(overlayStack.size).toBe(0);
    await selectPageSize(popup, 20);
    expect(pageSize.value).toBe(20);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it.each(["drawer", "modal"] as const)(
    "places the page-size menu above its %s and selects without closing the host",
    async (kind) => {
      let api!: ReturnType<typeof useModal>[1];
      const pageSize = ref(10);
      attach(
        defineComponent({
          setup() {
            const [Host, controller] = (
              kind === "drawer" ? useDrawer : useModal
            )({
              title: "Paginated records",
              description: "Host ownership",
            });
            api = controller;
            return () => h(Host, {}, { default: () => pagination(pageSize) });
          },
        }),
      );
      api.open();
      await settle();
      const { popup, trigger } = await openPageSize();
      const host = document.querySelector<HTMLElement>('[role="dialog"]')!;

      // The real primitive portals to body, outside the host's DOM stacking context.
      expect(host.contains(popup)).toBe(false);
      expect(Number(popup.style.zIndex)).toBeGreaterThan(
        Number(host.style.zIndex),
      );
      await selectPageSize(popup, 50);
      await vi.waitFor(() => expect(pageSize.value).toBe(50));
      expect(api.state.open).toBe(true);
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(document.activeElement).toBe(trigger);
    },
  );

  it("dismisses the menu before its nested modal and parent drawer on separate Escape presses", async () => {
    let drawerApi!: ReturnType<typeof useDrawer>[1];
    let modalApi!: ReturnType<typeof useModal>[1];
    const pageSize = ref(10);
    attach(
      defineComponent({
        setup() {
          const [Drawer, drawer] = useDrawer({
            title: "Records drawer",
            description: "Parent",
          });
          const [Modal, modal] = useModal({
            title: "Records modal",
            description: "Nested",
          });
          drawerApi = drawer;
          modalApi = modal;
          return () =>
            h(
              Drawer,
              {},
              {
                default: () =>
                  h(Modal, {}, { default: () => pagination(pageSize) }),
              },
            );
        },
      }),
    );
    drawerApi.open();
    await settle();
    modalApi.open();
    await settle();
    const { popup, trigger } = await openPageSize();
    const hosts = [
      ...document.querySelectorAll<HTMLElement>('[role="dialog"]'),
    ];
    expect(Number(popup.style.zIndex)).toBeGreaterThan(
      Math.max(...hosts.map((host) => Number(host.style.zIndex))),
    );

    // Reka still owns popup dismissal; pagination must not close the main host.
    escape();
    await settle();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(modalApi.state.open).toBe(true);
    expect(drawerApi.state.open).toBe(true);
    escape();
    await settle();
    expect(modalApi.state.open).toBe(false);
    expect(drawerApi.state.open).toBe(true);
    escape();
    await settle();
    expect(drawerApi.state.open).toBe(false);
    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.pointerEvents).toBe("");
  });

  it("closes a covered drawer menu without refocusing its hidden trigger over a new modal", async () => {
    let drawerApi!: ReturnType<typeof useDrawer>[1];
    let modalApi!: ReturnType<typeof useModal>[1];
    const pageSize = ref(10);
    attach(
      defineComponent({
        setup() {
          const [Drawer, drawer] = useDrawer({
            title: "Records drawer",
            description: "Parent",
          });
          const [Modal, modal] = useModal({
            title: "New modal",
            description: "Covering host",
          });
          drawerApi = drawer;
          modalApi = modal;
          return () =>
            h("div", [
              h(Drawer, {}, { default: () => pagination(pageSize) }),
              h(
                Modal,
                {},
                {
                  default: () =>
                    h("button", { "data-new-host-focus": "" }, "New action"),
                },
              ),
            ]);
        },
      }),
    );
    drawerApi.open();
    await settle();
    const { trigger } = await openPageSize();
    modalApi.open();
    await settle();

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(document.activeElement).not.toBe(trigger);
    expect(drawerApi.state.open).toBe(true);
    expect(modalApi.state.open).toBe(true);
    expect(pageSize.value).toBe(10);
  });
});
