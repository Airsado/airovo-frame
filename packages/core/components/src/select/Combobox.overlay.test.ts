// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, markRaw, nextTick } from "vue";
import { createI18n } from "vue-i18n";
import { afterEach, describe, expect, it } from "vitest";
import SearchSelect from "./SearchSelect.vue";
import { useForm, type FormApi } from "../../../forms/src";
import { useDrawer } from "../../../composables/src/drawer/use-drawer";
import { useModal } from "../../../composables/src/modal/use-modal";
import { overlayStack } from "../../../composables/src/overlay/overlay-stack";

const wrappers: VueWrapper[] = [];
const options = [
  { label: "First source", value: "first" },
  { label: "Second source", value: "second" },
];
const i18n = () =>
  createI18n({
    legacy: false,
    locale: "zh-CN",
    messages: {},
    missingWarn: false,
    fallbackWarn: false,
  });
async function settle() {
  await nextTick();
  await flushPromises();
  await new Promise<void>((resolve) => setTimeout(resolve, 15));
}
function attach(component: ReturnType<typeof defineComponent>) {
  const wrapper = mount(component, {
    attachTo: document.body,
    global: { plugins: [i18n()] },
  });
  wrappers.push(wrapper);
  return wrapper;
}
async function openSearch() {
  const trigger = document.querySelector<HTMLButtonElement>(
    '[data-slot="input-group-button"]',
  )!;
  trigger.click();
  await settle();
  const popup = document.querySelector<HTMLElement>(
    '[data-slot="popover-content"]',
  )!;
  expect(popup).toBeTruthy();
  return popup;
}
afterEach(async () => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  await settle();
  overlayStack.clear();
  document.body.innerHTML = "";
  document.body.style.overflow = "";
  document.body.style.pointerEvents = "";
});

describe("SearchSelect ownership through its real Combobox portal", () => {
  it.each(["modal", "drawer"] as const)(
    "places the real options above their %s and writes an external form once",
    async (kind) => {
      let host!: ReturnType<typeof useModal>[1];
      let form!: FormApi;
      const ChildForm = defineComponent({
        setup() {
          const [Form, api] = useForm({
            showDefaultActions: false,
            schema: [
              {
                fieldName: "source",
                label: "Source",
                component: markRaw(SearchSelect),
                componentProps: { options },
                rules: "required",
              },
            ],
            initialValues: { source: [{ value: "" }] },
          });
          form = api;
          return () => h(Form);
        },
      });
      attach(
        defineComponent({
          setup() {
            const [Host, api] = (kind === "modal" ? useModal : useDrawer)({
              title: "Source editor",
              description: "External form",
            });
            host = api;
            return () => h(Host, {}, { default: () => h(ChildForm) });
          },
        }),
      );
      host.open();
      await settle();
      const popup = await openSearch();
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
      expect(dialog.contains(popup)).toBe(false);
      // happy-dom has no hit testing: assert the owner layer as well as the
      // real primitive event, rather than replacing the portal with a stub.
      expect(Number(popup.style.zIndex)).toBeGreaterThan(
        Number(dialog.style.zIndex),
      );
      const input =
        dialog.querySelector<HTMLInputElement>('[role="combobox"]')!;
      // Search lives in the anchor, outside the portalled list. A browser
      // focusin on that input must not count as leaving the combobox.
      popup.querySelector<HTMLElement>('[role="option"]')!.focus();
      await settle();
      input.focus();
      await settle();
      expect(input.getAttribute("aria-expanded")).toBe("true");
      const second = [
        ...popup.querySelectorAll<HTMLElement>('[role="option"]'),
      ].find((option) => option.textContent?.includes("Second source"))!;
      second.click();
      await settle();
      expect(form.values.value.source).toEqual([{ value: "second" }]);
      await expect(form.validate()).resolves.toMatchObject({ valid: true });
      expect(host.state.open).toBe(true);
      expect(
        document
          .querySelector('[role="combobox"]')
          ?.getAttribute("aria-expanded"),
      ).toBe("false");
    },
  );

  it("closes a covered owner popup without restoring focus over the new modal", async () => {
    let parent!: ReturnType<typeof useDrawer>[1];
    let child!: ReturnType<typeof useModal>[1];
    attach(
      defineComponent({
        setup() {
          const [Drawer, drawer] = useDrawer({
            title: "Parent",
            description: "Source selection",
          });
          const [Modal, modal] = useModal({
            title: "Child",
            description: "New source",
          });
          parent = drawer;
          child = modal;
          return () =>
            h("main", [
              h(Drawer, {}, { default: () => h(SearchSelect, { options }) }),
              h(
                Modal,
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
    parent.open();
    await settle();
    await openSearch();
    const input =
      document.querySelector<HTMLInputElement>('[role="combobox"]')!;
    child.open();
    await settle();
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector('[data-slot="popover-content"]')).toBeNull();
    expect(document.activeElement).not.toBe(input);
    expect(child.state.open).toBe(true);
    expect(parent.state.open).toBe(true);
  });
});
