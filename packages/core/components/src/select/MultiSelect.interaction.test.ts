// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { createI18n } from "vue-i18n";
import { afterEach, describe, expect, it } from "vitest";
import MultiSelect, { type MultiSelectOption } from "./MultiSelect.vue";

const options: MultiSelectOption[] = [
  { label: "支付宝", value: "alipay" },
  { label: "微信支付", value: "wxpay" },
  { label: "QQ 钱包", value: "qqpay" },
];
const wrappers: VueWrapper[] = [];

function controlled(props: Record<string, unknown> = {}) {
  const wrapper = mount(MultiSelect, {
    attachTo: document.body,
    props: {
      options,
      modelValue: [],
      ...props,
      "onUpdate:modelValue": (value: string[]) =>
        wrapper.setProps({ modelValue: value }),
    },
    global: {
      plugins: [
        createI18n({
          legacy: false,
          locale: "zh-CN",
          messages: {
            "zh-CN": {
              common: {
                multiSelectPlaceholder: "选择支付方式",
                multiSelectEmpty: "没有匹配的项目",
                multiSelectCreate: "添加“{value}”",
                remove: "移除",
                open: "打开",
              },
            },
          },
        }),
      ],
    },
  });
  wrappers.push(wrapper);
  return wrapper;
}

async function settle() {
  await nextTick();
  await flushPromises();
  await new Promise<void>((resolve) => setTimeout(resolve, 15));
}

async function openSelect(wrapper: VueWrapper) {
  await wrapper.get('input[role="combobox"]').trigger("focus");
  await settle();
  const popup = document.querySelector<HTMLElement>(
    '[data-slot="popover-content"]',
  );
  expect(popup).not.toBeNull();
  return popup!;
}

function getItem(popup: HTMLElement, label: string) {
  const item = [...popup.querySelectorAll<HTMLElement>('[role="option"]')].find(
    (element) => element.textContent?.trim() === label,
  );
  expect(item, `visible option: ${label}`).toBeDefined();
  return item!;
}

function assertSelected(item: HTMLElement, selected: boolean) {
  expect(item.getAttribute("aria-selected")).toBe(String(selected));
  expect(item.getAttribute("data-state")).toBe(
    selected ? "checked" : "unchecked",
  );
}

function getHighlightSurface(item: HTMLElement) {
  const surface = item.closest<HTMLElement>(
    '[data-slot="multi-select-option"]',
  );
  expect(surface).not.toBeNull();
  return surface!;
}

function activeSurfaces(popup: HTMLElement) {
  // happy-dom does not load the Tailwind stylesheet. Check the actual surface
  // color classes instead, while using real Command/Listbox state and events.
  return [
    ...popup.querySelectorAll<HTMLElement>('[data-slot="multi-select-option"]'),
  ].filter((surface) => surface.classList.contains("bg-accent"));
}

async function hover(item: HTMLElement) {
  getHighlightSurface(item).dispatchEvent(new MouseEvent("mouseenter"));
  item.dispatchEvent(
    new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
  );
  await settle();
}

async function leaveList(popup: HTMLElement) {
  popup
    .querySelector<HTMLElement>('[data-slot="command-list"]')!
    .dispatchEvent(new MouseEvent("mouseleave"));
  await settle();
}

afterEach(async () => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  await settle();
  document.body.innerHTML = "";
  document.body.style.pointerEvents = "";
  document.body.style.overflow = "";
});

describe("MultiSelect with real Command/Listbox primitives", () => {
  it("removes both selected values without leaving stale selection or background", async () => {
    const wrapper = controlled();
    const popup = await openSelect(wrapper);
    const alipay = getItem(popup, "支付宝");
    const wxpay = getItem(popup, "微信支付");

    await hover(alipay);
    alipay.click();
    await settle();
    await hover(wxpay);
    wxpay.click();
    await settle();
    expect(wrapper.props("modelValue")).toEqual(["alipay", "wxpay"]);
    expect(wrapper.findAll('[data-slot="combobox-chip"]')).toHaveLength(2);
    assertSelected(alipay, true);
    assertSelected(wxpay, true);

    await hover(alipay);
    alipay.click();
    await settle();
    assertSelected(alipay, false);
    assertSelected(wxpay, true);
    await hover(wxpay);
    wxpay.click();
    await settle();
    await leaveList(popup);

    expect(wrapper.props("modelValue")).toEqual([]);
    expect(wrapper.findAll('[data-slot="combobox-chip"]')).toHaveLength(0);
    assertSelected(alipay, false);
    assertSelected(wxpay, false);
    expect(activeSurfaces(popup)).toHaveLength(0);
    expect(wrapper.get("input").attributes("aria-expanded")).toBe("true");
  });

  it("shows at most one hovered row and clears it when the pointer leaves", async () => {
    const wrapper = controlled({ modelValue: ["alipay"] });
    const popup = await openSelect(wrapper);
    const alipay = getItem(popup, "支付宝");
    const wxpay = getItem(popup, "微信支付");

    await hover(alipay);
    expect(activeSurfaces(popup)).toEqual([getHighlightSurface(alipay)]);
    await hover(wxpay);
    expect(activeSurfaces(popup)).toEqual([getHighlightSurface(wxpay)]);
    assertSelected(alipay, true);
    assertSelected(wxpay, false);
    await leaveList(popup);
    expect(activeSurfaces(popup)).toHaveLength(0);
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("keeps keyboard selection, native option state, and chip removal synchronized", async () => {
    const wrapper = controlled();
    const popup = await openSelect(wrapper);
    const input = wrapper.get("input");
    await leaveList(popup);
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "Enter" });
    await settle();

    const wxpay = getItem(popup, "微信支付");
    expect(wrapper.props("modelValue")).toEqual(["wxpay"]);
    assertSelected(wxpay, true);
    await wrapper.get('[aria-label="移除 微信支付"]').trigger("click");
    await settle();
    expect(wrapper.props("modelValue")).toEqual([]);
    assertSelected(wxpay, false);
    expect(wrapper.findAll('[data-slot="combobox-chip"]')).toHaveLength(0);

    await wrapper.setProps({ modelValue: ["alipay"] });
    await settle();
    assertSelected(getItem(popup, "支付宝"), true);
    await input.trigger("keydown", { key: "Backspace" });
    await settle();
    assertSelected(getItem(popup, "支付宝"), false);
    expect(wrapper.props("modelValue")).toEqual([]);
  });

  it("does not highlight or select disabled options and skips them with the keyboard", async () => {
    const wrapper = controlled({
      options: [options[0], { ...options[1], disabled: true }, options[2]],
    });
    const popup = await openSelect(wrapper);
    const disabled = getItem(popup, "微信支付");
    await leaveList(popup);
    await hover(disabled);
    expect(activeSurfaces(popup)).toHaveLength(0);
    disabled.click();
    await settle();
    expect(wrapper.props("modelValue")).toEqual([]);

    const input = wrapper.get("input");
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "Enter" });
    await settle();
    expect(wrapper.props("modelValue")).toEqual(["qqpay"]);
    assertSelected(disabled, false);
    assertSelected(getItem(popup, "QQ 钱包"), true);
  });

  it("clears a custom-entry highlight when committing it resets the search", async () => {
    const wrapper = controlled({ allowCreate: true });
    const popup = await openSelect(wrapper);
    const input = wrapper.get("input");
    await input.setValue("银行卡");
    await settle();
    const create = getItem(popup, "＋添加“银行卡”");
    await hover(create);
    expect(activeSurfaces(popup)).toEqual([getHighlightSurface(create)]);
    create.click();
    await settle();

    expect(wrapper.props("modelValue")).toEqual(["银行卡"]);
    expect(wrapper.get('[data-slot="combobox-chip"]').text()).toContain(
      "银行卡",
    );
    expect((input.element as HTMLInputElement).value).toBe("");
    expect(activeSurfaces(popup)).toHaveLength(0);
    expect(popup.querySelectorAll('[role="option"]')).toHaveLength(
      options.length,
    );
    for (const option of options)
      assertSelected(getItem(popup, option.label), false);
  });
});
