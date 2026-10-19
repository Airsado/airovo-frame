import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { createI18n } from "vue-i18n";
import { afterEach, describe, expect, it, vi } from "vitest";
import IconPicker from "./IconPicker.vue";
import SelectBox from "../select/SelectBox.vue";
import { useForm, type FormApi } from "../../../forms/src";
import { useModal } from "../../../composables/src/modal/use-modal";
import { overlayStack } from "../../../composables/src/overlay/overlay-stack";
import type { IconPickerSource } from "./types";

const wrappers: VueWrapper[] = [];
const local = ["lucide:home", "lucide:search", "lucide:settings"];
function attach(
  component: Parameters<typeof mount>[0],
  options: Record<string, unknown> = {},
) {
  const wrapper = mount(component, {
    attachTo: document.body,
    global: {
      plugins: [
        createI18n({
          legacy: false,
          locale: "zh-CN",
          messages: {},
          missingWarn: false,
          fallbackWarn: false,
        }),
      ],
    },
    ...options,
  });
  wrappers.push(wrapper);
  return wrapper;
}
async function settle() {
  await nextTick();
  await flushPromises();
  await new Promise((resolve) => setTimeout(resolve, 15));
}
async function open(_wrapper: VueWrapper) {
  document
    .querySelector<HTMLButtonElement>('[data-slot="icon-picker"] button')!
    .click();
  await settle();
}
function option(name: string) {
  return document.querySelector<HTMLButtonElement>(
    `[data-icon-option][aria-label="${name}"]`,
  )!;
}
async function chooseSource(wrapper: VueWrapper, id: string) {
  wrapper.findComponent(SelectBox).vm.$emit("update:modelValue", id);
  await settle();
}
afterEach(async () => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  await settle();
  overlayStack.clear();
  document.body.innerHTML = "";
  document.body.style.overflow = "";
  document.body.style.pointerEvents = "";
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("IconPicker", () => {
  it("browses and selects registered local icons offline, then clears the bound value", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("Offline"));
    vi.stubGlobal("fetch", fetcher);
    const wrapper = attach(IconPicker, {
      props: { icons: local, modelValue: "" },
    });
    expect(document.querySelector("[data-icon-option]")).toBeNull();
    await open(wrapper);
    expect(document.querySelectorAll("[data-icon-option]")).toHaveLength(3);
    option("lucide:search").click();
    await settle();
    expect(wrapper.emitted("update:modelValue")).toEqual([["lucide:search"]]);
    expect(document.querySelector("[data-icon-option]")).toBeNull();
    await wrapper.setProps({ modelValue: "lucide:search" });
    await wrapper.get('[aria-label="清空图标"]').trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([""]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("paginates the filtered list and supports arrow keys between icon buttons", async () => {
    const wrapper = attach(IconPicker, {
      props: { icons: local, pageSize: 2 },
    });
    await open(wrapper);
    expect(document.querySelectorAll("[data-icon-option]")).toHaveLength(2);
    option("lucide:home").focus();
    option("lucide:home").dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(document.activeElement).toBe(option("lucide:search"));
    document
      .querySelector<HTMLButtonElement>('[aria-label="下一页图标"]')!
      .click();
    await settle();
    expect(document.querySelectorAll("[data-icon-option]")).toHaveLength(1);
    expect(option("lucide:settings")).toBeTruthy();
    const search = document.querySelector<HTMLInputElement>(
      '[aria-label="搜索图标"]',
    )!;
    search.value = "home";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 230));
    await settle();
    expect(option("lucide:home")).toBeTruthy();
    expect(option("lucide:settings")).toBeNull();
    expect(
      document.querySelector<HTMLButtonElement>('[aria-label="上一页图标"]')!
        .disabled,
    ).toBe(true);
  });

  it.each(["disabled", "readonly"] as const)(
    "prevents selection and clearing while %s",
    async (mode) => {
      const wrapper = attach(IconPicker, {
        props: { icons: local, modelValue: local[0], [mode]: true },
      });
      await open(wrapper);
      expect(document.querySelector("[data-icon-option]")).toBeNull();
      expect(wrapper.find('[aria-label="清空图标"]').exists()).toBe(false);
      expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    },
  );

  it("loads catalogs lazily, shows errors and lets the user retry", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("远端不可用"))
      .mockResolvedValueOnce(local);
    const source: IconPickerSource = { id: "retry", label: "Test", load };
    const wrapper = attach(IconPicker, {
      props: { icons: [], sources: [source] },
    });
    expect(load).not.toHaveBeenCalled();
    await open(wrapper);
    await chooseSource(wrapper, "retry");
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "远端不可用",
    );
    const retry = [
      ...document.querySelectorAll<HTMLButtonElement>("button"),
    ].find((button) => button.textContent === "重新加载")!;
    retry.click();
    await settle();
    expect(load).toHaveBeenCalledTimes(2);
    expect(option("lucide:home")).toBeTruthy();
  });

  it("aborts a previous source and ignores its late result when the library changes", async () => {
    let resolve!: (icons: string[]) => void;
    let previousSignal!: AbortSignal;
    const sources: IconPickerSource[] = [
      {
        id: "slow",
        label: "Slow",
        load: ({ signal }) => {
          previousSignal = signal;
          return new Promise((done) => {
            resolve = done;
          });
        },
      },
      { id: "fast", label: "Fast", load: async () => ["lucide:settings"] },
    ];
    const wrapper = attach(IconPicker, { props: { icons: [], sources } });
    await open(wrapper);
    await chooseSource(wrapper, "slow");
    await chooseSource(wrapper, "fast");
    expect(previousSignal.aborted).toBe(true);
    expect(option("lucide:settings")).toBeTruthy();
    resolve(["lucide:home"]);
    await settle();
    expect(option("lucide:home")).toBeNull();
    expect(option("lucide:settings")).toBeTruthy();
  });

  it("binds the builtin schema field inside a real modal and closes a covered popup", async () => {
    let host!: ReturnType<typeof useModal>[1];
    let child!: ReturnType<typeof useModal>[1];
    let form!: FormApi;
    const FormContent = defineComponent({
      setup() {
        const [Form, api] = useForm({
          showDefaultActions: false,
          schema: [
            {
              fieldName: "icon",
              label: "Icon",
              component: "IconPicker",
              rules: "required",
              componentProps: { icons: local },
            },
          ],
        });
        form = api;
        return () => h(Form);
      },
    });
    const wrapper = attach(
      defineComponent({
        setup() {
          const [Host, api] = useModal({
            title: "Icon form",
            description: "Select an icon",
          });
          const [Child, childApi] = useModal({
            title: "Next modal",
            description: "Keep focus here",
          });
          host = api;
          child = childApi;
          return () =>
            h("main", [
              h(Host, {}, { default: () => h(FormContent) }),
              h(Child, {}, { default: () => h("button", "Next action") }),
            ]);
        },
      }),
    );
    host.open();
    await settle();
    await open(wrapper);
    const popup = document.querySelector<HTMLElement>(
      '[aria-label="图标选择"]',
    )!;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(Number(popup.style.zIndex)).toBeGreaterThan(
      Number(dialog.style.zIndex),
    );
    option("lucide:search").click();
    await settle();
    expect(form.values.value.icon).toEqual([{ value: "lucide:search" }]);
    await expect(form.validate()).resolves.toMatchObject({ valid: true });
    await open(wrapper);
    child.open();
    await settle();
    expect(document.querySelector('[aria-label="图标选择"]')).toBeNull();
    expect(child.state.open).toBe(true);
    expect(host.state.open).toBe(true);
  });
});
