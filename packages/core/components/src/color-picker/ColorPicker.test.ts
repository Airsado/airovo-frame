import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { createI18n } from "vue-i18n";
import { afterEach, describe, expect, it, vi } from "vitest";
import ColorPicker from "./ColorPicker.vue";
import { useModal } from "../../../composables/src/modal/use-modal";
import { overlayStack } from "../../../composables/src/overlay/overlay-stack";

const wrappers: VueWrapper[] = [];
function attach(component: Parameters<typeof mount>[0], options = {}) {
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
  await new Promise((resolve) => setTimeout(resolve, 20));
}
function element<T extends HTMLElement = HTMLElement>(selector: string): T {
  const target = document.querySelector<T>(selector);
  expect(target).not.toBeNull();
  return target!;
}
async function open() {
  element<HTMLButtonElement>('[data-slot="color-picker-trigger"]').click();
  await settle();
}
async function input(value: string) {
  const target = element<HTMLInputElement>(
    '[aria-label="颜色选择"] input[type="text"]',
  );
  target.focus();
  target.value = value;
  target.dispatchEvent(new Event("input", { bubbles: true }));
  target.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    }),
  );
  await settle();
  return target;
}
afterEach(async () => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  await settle();
  overlayStack.clear();
  document.body.innerHTML = "";
  document.body.style.pointerEvents = "";
  document.body.style.overflow = "";
  vi.restoreAllMocks();
});

describe("ColorPicker", () => {
  it("commits the visible fallback when it is chosen from an empty picker", async () => {
    const wrapper = attach(ColorPicker, { props: { modelValue: "" } });
    await open();
    element('[data-color="#3b82f6"]').click();
    await settle();
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["#3b82f6"]);
  });

  it("selects a preset, commits HEX input, restores invalid drafts and clears", async () => {
    const wrapper = attach(ColorPicker, {
      props: { modelValue: "#c2410c", presets: ["#0f0", "#00ff00", "invalid"] },
    });
    await open();
    expect(document.querySelectorAll("[data-color]")).toHaveLength(1);
    element('[data-color="#00ff00"]').click();
    await settle();
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["#00ff00"]);
    await wrapper.setProps({ modelValue: "#00ff00" });
    const hexInput = await input("#12A");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["#1122aa"]);
    expect(document.activeElement).toBe(hexInput);
    await wrapper.setProps({ modelValue: "#1122aa" });
    const count = wrapper.emitted("update:modelValue")!.length;
    const target = await input("invalid-color");
    expect(target.value).toBe("#1122aa");
    expect(wrapper.emitted("update:modelValue")).toHaveLength(count);
    await wrapper.get('[aria-label="清空颜色"]').trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([""]);
    await settle();
    expect(document.querySelector('[aria-label="颜色选择"]')).toBeNull();
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([""]);
  });

  it("supports alpha only when enabled and ignores wheel changes", async () => {
    const wrapper = attach(ColorPicker, {
      props: { modelValue: "#3b82f680", showAlpha: true },
    });
    await open();
    expect(
      document.querySelector('[role="slider"][aria-label="不透明度"]'),
    ).not.toBeNull();
    const target = await input("#ff000080");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["#ff000080"]);
    const count = wrapper.emitted("update:modelValue")!.length;
    target.dispatchEvent(new FocusEvent("focus"));
    target.dispatchEvent(
      new WheelEvent("wheel", { deltaY: -100, bubbles: true }),
    );
    await settle();
    expect(wrapper.emitted("update:modelValue")).toHaveLength(count);
    await wrapper.setProps({ showAlpha: false });
    expect(
      document.querySelector('[role="slider"][aria-label="不透明度"]'),
    ).toBeNull();
    await input("#ff000080");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["#ff0000"]);
  });

  it("keeps the chosen hue while the color is black and updates through the keyboard", async () => {
    const wrapper = attach(ColorPicker, { props: { modelValue: "#000000" } });
    await open();
    const hue = element('[role="slider"][aria-label="色相"]');
    for (let step = 0; step < 12; step++) {
      hue.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
      await nextTick();
    }
    await settle();
    expect(Number(hue.getAttribute("aria-valuenow"))).toBe(120);
    const area = element('[role="slider"][aria-label="饱和度与亮度"]');
    area.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowRight",
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    area.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowUp",
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    await settle();
    const hex = String(wrapper.emitted("update:modelValue")?.at(-1)?.[0]);
    expect(hex).toMatch(/^#[\da-f]{6}$/);
    expect(hex).not.toBe("#000000");
    const red = parseInt(hex.slice(1, 3), 16);
    const green = parseInt(hex.slice(3, 5), 16);
    expect(green).toBeGreaterThan(red);
  });

  it("keeps pointer capture and the same area mounted throughout a controlled drag", async () => {
    const wrapper = attach(ColorPicker, {
      props: {
        modelValue: "#1122aa",
        "onUpdate:modelValue": (value: string) =>
          wrapper.setProps({ modelValue: value }),
      },
    });
    await open();
    const area = element('[aria-label="颜色选择"] [role="application"]');
    vi.spyOn(area, "getBoundingClientRect").mockReturnValue(
      new DOMRect(0, 0, 100, 100),
    );
    let captured = false;
    area.setPointerCapture = () => {
      captured = true;
    };
    area.hasPointerCapture = () => captured;
    area.releasePointerCapture = () => {
      captured = false;
    };
    area.dispatchEvent(
      new PointerEvent("pointerdown", {
        pointerId: 1,
        clientX: 20,
        clientY: 80,
        bubbles: true,
        cancelable: true,
      }),
    );
    await nextTick();
    const first = wrapper.emitted("update:modelValue")?.at(-1)?.[0];
    expect(
      document.querySelector('[aria-label="颜色选择"] [role="application"]'),
    ).toBe(area);
    area.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerId: 1,
        clientX: 80,
        clientY: 20,
        bubbles: true,
      }),
    );
    await nextTick();
    expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).not.toBe(first);
    expect(
      document.querySelector('[aria-label="颜色选择"] [role="application"]'),
    ).toBe(area);
    area.dispatchEvent(
      new PointerEvent("pointerup", { pointerId: 1, bubbles: true }),
    );
    expect(captured).toBe(false);
    expect(
      wrapper
        .get('[data-slot="color-picker-trigger"]')
        .attributes("aria-expanded"),
    ).toBe("true");
  });

  it.each(["disabled", "readonly"] as const)(
    "blocks selection and clearing while %s, including dynamic changes",
    async (mode) => {
      const wrapper = attach(ColorPicker, { props: { modelValue: "#c2410c" } });
      await open();
      await wrapper.setProps({ [mode]: true });
      await settle();
      expect(document.querySelector('[aria-label="颜色选择"]')).toBeNull();
      await open();
      expect(document.querySelector('[aria-label="颜色选择"]')).toBeNull();
      expect(wrapper.find('[aria-label="清空颜色"]').exists()).toBe(false);
      expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    },
  );

  it("places its portal above the owning modal and closes it when the owner is covered", async () => {
    let host!: ReturnType<typeof useModal>[1];
    let child!: ReturnType<typeof useModal>[1];
    attach(
      defineComponent({
        setup() {
          const [Host, api] = useModal({
            title: "Color",
            description: "Select color",
          });
          const [Child, childApi] = useModal({
            title: "Next",
            description: "Next action",
          });
          host = api;
          child = childApi;
          return () =>
            h("main", [
              h(Host, {}, { default: () => h(ColorPicker) }),
              h(Child),
            ]);
        },
      }),
    );
    host.open();
    await settle();
    await open();
    const popup = element('[aria-label="颜色选择"]');
    const dialog = element('[role="dialog"]');
    expect(Number(popup.style.zIndex)).toBeGreaterThan(
      Number(dialog.style.zIndex),
    );
    expect(dialog.contains(popup)).toBe(false);
    child.open();
    await settle();
    expect(document.querySelector('[aria-label="颜色选择"]')).toBeNull();
    expect(host.state.open).toBe(true);
    expect(child.state.open).toBe(true);
  });
});
