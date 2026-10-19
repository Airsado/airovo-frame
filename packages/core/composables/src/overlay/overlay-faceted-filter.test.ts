// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import { createI18n } from "vue-i18n";
import { afterEach, describe, expect, it } from "vitest";
import DataTableToolbar from "../../../components/src/data-table/DataTableToolbar.vue";
import type { DataTableFilterValue } from "../../../components/src/data-table/types";
import { useDrawer } from "../drawer/use-drawer";
import { useModal } from "../modal/use-modal";
import { overlayStack } from "./overlay-stack";

const wrappers: VueWrapper[] = [];
const filters = [
  {
    key: "status",
    title: "审核状态",
    singleSelect: true,
    options: [
      { label: "待审核", value: "0" },
      { label: "已通过", value: "1" },
    ],
  },
];
async function settle() {
  await nextTick();
  await flushPromises();
  await new Promise<void>((resolve) => setTimeout(resolve, 15));
}
function attach(component: ReturnType<typeof defineComponent>) {
  const wrapper = mount(component, {
    attachTo: document.body,
    global: {
      plugins: [createI18n({ legacy: false, locale: "zh-CN", messages: {} })],
      stubs: { Icon: true },
    },
  });
  wrappers.push(wrapper);
  return wrapper;
}
async function openFilter() {
  const trigger = [
    ...document.querySelectorAll<HTMLButtonElement>("button"),
  ].find((button) => button.textContent?.trim() === "审核状态")!;
  expect(trigger).toBeTruthy();
  trigger.click();
  await settle();
  const popup = document.querySelector<HTMLElement>(
    '[data-slot="popover-content"]',
  )!;
  expect(popup).toBeTruthy();
  return { trigger, popup };
}
function ownerDialog() {
  return document
    .querySelector("[data-owner-marker]")!
    .closest<HTMLElement>('[role="dialog"]')!;
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
afterEach(async () => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  await settle();
  overlayStack.clear();
  document.body.innerHTML = "";
  document.body.style.pointerEvents = "";
  document.body.style.overflow = "";
});

describe("faceted table filters in framework overlays", () => {
  it.each(["drawer", "modal"] as const)(
    "portals above its %s owner and selects an actual DOM option",
    async (kind) => {
      let api!: ReturnType<typeof useDrawer>[1];
      const values = ref<Record<string, DataTableFilterValue>>({});
      // Use an external child exactly as a table inside a business drawer does.
      const Child = defineComponent({
        setup: () => () =>
          h("div", { "data-owner-marker": "" }, [
            h(DataTableToolbar, {
              filters,
              filterValues: values.value,
              showSearch: false,
              hideViewOptions: true,
              "onUpdate:filterValues": (value) => {
                values.value = value;
              },
            }),
          ]),
      });
      attach(
        defineComponent({
          setup() {
            const [Host, controller] = (
              kind === "drawer" ? useDrawer : useModal
            )({ title: "Owner", description: "Filter context", side: "right" });
            api = controller;
            return () => h(Host, {}, { default: () => h(Child) });
          },
        }),
      );
      api.open();
      await settle();
      const { trigger, popup } = await openFilter();
      const dialog = ownerDialog();
      expect(dialog.contains(popup)).toBe(false);
      expect(Number(popup.style.zIndex)).toBeGreaterThan(
        Number(dialog.style.zIndex),
      );
      const pending = [
        ...popup.querySelectorAll<HTMLElement>('[role="option"]'),
      ].find((option) => option.textContent?.trim() === "待审核")!;
      expect(pending).toBeTruthy();
      pending.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          pointerType: "mouse",
        }),
      );
      pending.click();
      await settle();
      expect(values.value.status).toBe("0");
      expect(pending.getAttribute("aria-selected")).toBe("true");
      expect(api.state.open).toBe(true);
      escape();
      await settle();
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(api.state.open).toBe(true);
      expect(document.activeElement).toBe(trigger);
      escape();
      await settle();
      expect(api.state.open).toBe(false);
    },
  );

  it("closes a covered owner's filter without returning focus over the newer modal", async () => {
    let parentApi!: ReturnType<typeof useModal>[1];
    let childApi!: ReturnType<typeof useModal>[1];
    attach(
      defineComponent({
        setup() {
          const [Parent, parent] = useModal({
            title: "Parent",
            description: "Parent filter",
          });
          const [Child, child] = useModal({
            title: "Child",
            description: "New owner",
          });
          parentApi = parent;
          childApi = child;
          return () =>
            h("div", [
              h(
                Parent,
                {},
                {
                  default: () =>
                    h("div", { "data-owner-marker": "" }, [
                      h(DataTableToolbar, {
                        filters,
                        showSearch: false,
                        hideViewOptions: true,
                      }),
                    ]),
                },
              ),
              h(
                Child,
                {},
                {
                  default: () =>
                    h("button", { "data-child-action": "" }, "Child action"),
                },
              ),
            ]);
        },
      }),
    );
    parentApi.open();
    await settle();
    const { trigger } = await openFilter();
    childApi.open();
    await settle();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector('[data-slot="popover-content"]')).toBeNull();
    expect(document.activeElement).not.toBe(trigger);
    expect(childApi.state.open).toBe(true);
    expect(parentApi.state.open).toBe(true);
  });

  it("dismisses its popup on API closure and inherits the reserved layer after reopening", async () => {
    let api!: ReturnType<typeof useDrawer>[1];
    attach(
      defineComponent({
        setup() {
          const [Drawer, controller] = useDrawer({
            title: "Reopen",
            description: "Owner lifecycle",
            side: "right",
          });
          api = controller;
          return () =>
            h(
              Drawer,
              {},
              {
                default: () =>
                  h("div", { "data-owner-marker": "" }, [
                    h(DataTableToolbar, {
                      filters,
                      showSearch: false,
                      hideViewOptions: true,
                    }),
                  ]),
              },
            );
        },
      }),
    );
    api.open();
    await settle();
    const { popup } = await openFilter();
    const oldLayer = Number(popup.style.zIndex);
    await api.close("api");
    await settle();
    expect(document.querySelector('[data-slot="popover-content"]')).toBeNull();
    api.open();
    await settle();
    const reopened = await openFilter();
    expect(Number(reopened.popup.style.zIndex)).toBeGreaterThan(oldLayer);
    expect(Number(reopened.popup.style.zIndex)).toBeGreaterThan(
      Number(ownerDialog().style.zIndex),
    );
  });
});
