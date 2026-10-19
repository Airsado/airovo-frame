// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { createI18n } from "vue-i18n";
import { afterEach, describe, expect, it, vi } from "vitest";
import FacetedFilter from "./FacetedFilter.vue";

const global = {
  plugins: [
    createI18n({
      legacy: false,
      locale: "zh-CN",
      messages: {
        "zh-CN": {
          common: {
            filter: "筛选",
            noResults: "未找到结果。",
            clearFilters: "清除筛选",
            selected: "已选择",
          },
        },
      },
    }),
  ],
};
const wrappers: VueWrapper[] = [];

function attach(props: Record<string, unknown> = {}, customGlobal = global) {
  const wrapper = mount(FacetedFilter, {
    attachTo: document.body,
    global: customGlobal,
    props,
  });
  wrappers.push(wrapper);
  return wrapper;
}
function controlled(props: Record<string, unknown>) {
  const wrapper = attach({
    ...props,
    "onUpdate:modelValue": (value: string | string[] | undefined) =>
      wrapper.setProps({ modelValue: value }),
  });
  return wrapper;
}
async function settle() {
  await nextTick();
  await flushPromises();
  await new Promise<void>((resolve) => setTimeout(resolve, 15));
}
async function openFilter(wrapper: VueWrapper) {
  const trigger = wrapper.get("button");
  await trigger.trigger("click");
  await settle();
  const popup = document.querySelector<HTMLElement>(
    '[data-slot="popover-content"]',
  );
  expect(popup).not.toBeNull();
  expect(trigger.attributes("aria-expanded")).toBe("true");
  return { trigger, popup: popup! };
}
function findItem(popup: HTMLElement, label: string) {
  return [
    ...popup.querySelectorAll<HTMLElement>('[data-slot="command-item"]'),
  ].find(
    (item) =>
      item.querySelector("[title]")?.getAttribute("title") === label ||
      item.textContent?.trim() === label,
  );
}
function getItem(popup: HTMLElement, label: string): HTMLElement {
  const item = findItem(popup, label);
  expect(item, `visible command item: ${label}`).toBeDefined();
  return item!;
}
function candidateLabels(popup: HTMLElement): string[] {
  return [...popup.querySelectorAll('[data-slot="command-item"] [title]')].map(
    (element) => element.getAttribute("title")!,
  );
}
async function search(popup: HTMLElement, value: string) {
  const input = popup.querySelector<HTMLInputElement>("input")!;
  expect(input).toBeTruthy();
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
  return input;
}

afterEach(async () => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  await settle();
  document.body.innerHTML = "";
  document.body.style.pointerEvents = "";
  document.body.style.overflow = "";
});

describe("FacetedFilter", () => {
  it("uses locale defaults while explicit labels remain authoritative", () => {
    const i18n = createI18n({
      legacy: false,
      locale: "en-US",
      messages: {
        "en-US": {
          common: {
            filter: "Filter",
            noResults: "No results",
            clearFilters: "Clear filters",
            selected: "selected",
          },
        },
      },
    });
    const wrapper = attach(
      { options: [{ label: "Open", value: "open" }] },
      { plugins: [i18n] },
    );
    expect(wrapper.text()).toContain("Filter");
    const explicit = attach({
      title: "状态",
      emptyText: "没有状态",
      clearText: "清除状态",
      selectedText: "项",
      options: [{ label: "运行中", value: "running" }],
    });
    expect(explicit.text()).toContain("状态");
  });

  it("moves the real Command highlight with the mouse without selecting a value", async () => {
    const wrapper = controlled({
      options: [
        { label: "运行中", value: "running" },
        { label: "已暂停", value: "paused" },
      ],
      modelValue: [],
    });
    const { popup } = await openFilter(wrapper);
    expect(popup.style.zIndex).toBe("");
    const first = getItem(popup, "运行中");
    const second = getItem(popup, "已暂停");
    first.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );
    await settle();
    expect(first.hasAttribute("data-highlighted")).toBe(true);
    second.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );
    await settle();
    expect(second.hasAttribute("data-highlighted")).toBe(true);
    expect(first.hasAttribute("data-highlighted")).toBe(false);
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("keeps the current search and popup while checking several options", async () => {
    const wrapper = controlled({
      options: [
        { label: "站点 Alpha", value: "alpha" },
        { label: "站点 Beta", value: "beta" },
        { label: "Other", value: "other" },
      ],
      modelValue: ["beta"],
    });
    const { trigger, popup } = await openFilter(wrapper);
    const input = await search(popup, "站点");
    expect(candidateLabels(popup)).toEqual(["站点 Alpha", "站点 Beta"]);
    expect(getItem(popup, "站点 Beta").getAttribute("aria-selected")).toBe(
      "true",
    );
    getItem(popup, "站点 Alpha").click();
    await settle();
    expect(wrapper.emitted("update:modelValue")).toEqual([[["beta", "alpha"]]]);
    expect(input.value).toBe("站点");
    expect(trigger.attributes("aria-expanded")).toBe("true");
    expect(getItem(popup, "站点 Alpha").getAttribute("aria-selected")).toBe(
      "true",
    );
    getItem(popup, "站点 Beta").click();
    await settle();
    expect(wrapper.emitted("update:modelValue")).toEqual([
      [["beta", "alpha"]],
      [["alpha"]],
    ]);
    expect(getItem(popup, "站点 Beta").getAttribute("aria-selected")).toBe(
      "false",
    );
    expect(input.value).toBe("站点");
    expect(trigger.attributes("aria-expanded")).toBe("true");
  });

  it.each([
    {
      name: "scalar",
      initial: "running",
      cancelled: undefined,
      next: "paused",
    },
    { name: "array", initial: ["running"], cancelled: [], next: ["paused"] },
  ])(
    "toggles a single selection off and retains its $name model shape",
    async ({ initial, cancelled, next }) => {
      const wrapper = controlled({
        singleSelect: true,
        modelValue: initial,
        options: [
          { label: "运行中", value: "running" },
          { label: "已暂停", value: "paused" },
        ],
      });
      const { popup } = await openFilter(wrapper);
      expect(getItem(popup, "运行中").getAttribute("aria-selected")).toBe(
        "true",
      );
      getItem(popup, "运行中").click();
      await settle();
      expect(wrapper.emitted("update:modelValue")).toEqual([[cancelled]]);
      expect(getItem(popup, "运行中").getAttribute("aria-selected")).toBe(
        "false",
      );
      getItem(popup, "已暂停").click();
      await settle();
      expect(wrapper.emitted("update:modelValue")).toEqual([
        [cancelled],
        [next],
      ]);
      expect(getItem(popup, "已暂停").getAttribute("aria-selected")).toBe(
        "true",
      );
      expect(getItem(popup, "运行中").getAttribute("aria-selected")).toBe(
        "false",
      );
    },
  );

  it("shows an explicit zero count and clears the controlled filter in place", async () => {
    const wrapper = controlled({
      options: [{ label: "运行中", value: "running", count: 0 }],
      modelValue: ["running"],
    });
    const { trigger, popup } = await openFilter(wrapper);
    expect(
      getItem(popup, "运行中").querySelector(".font-mono")?.textContent?.trim(),
    ).toBe("0");
    getItem(popup, "清除筛选").click();
    await settle();
    expect(wrapper.emitted("update:modelValue")).toEqual([[[]]]);
    expect(getItem(popup, "运行中").getAttribute("aria-selected")).toBe(
      "false",
    );
    expect(findItem(popup, "清除筛选")).toBeUndefined();
    expect(trigger.attributes("aria-expanded")).toBe("true");
  });

  it("does not emit from a disabled option or a filter disabled while open", async () => {
    const wrapper = controlled({
      options: [
        { label: "运行中", value: "running" },
        { label: "禁止选择", value: "disabled", disabled: true },
      ],
      modelValue: ["running"],
    });
    const { popup } = await openFilter(wrapper);
    const disabled = getItem(popup, "禁止选择");
    expect(disabled.hasAttribute("data-disabled")).toBe(true);
    disabled.click();
    await settle();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    await wrapper.setProps({ disabled: true });
    getItem(popup, "运行中").click();
    getItem(popup, "清除筛选").click();
    await settle();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("reacts to Chinese searches and replacement candidates without stale Command registrations", async () => {
    const wrapper = controlled({
      options: [
        { label: "爱情片", value: "romance" },
        { label: "动作片", value: "action" },
      ],
      modelValue: [],
    });
    const { popup } = await openFilter(wrapper);
    await search(popup, "爱情");
    expect(candidateLabels(popup)).toEqual(["爱情片"]);
    await wrapper.setProps({
      options: [
        { label: "爱情动作片", value: "action" },
        { label: "喜剧片", value: "comedy" },
      ],
    });
    await settle();
    expect(candidateLabels(popup)).toEqual(["爱情动作片"]);
    await search(popup, "喜剧");
    expect(candidateLabels(popup)).toEqual(["喜剧片"]);
    await search(popup, "不存在的分类");
    expect(candidateLabels(popup)).toEqual([]);
    expect(
      popup.querySelector('[data-slot="command-empty"]')?.textContent?.trim(),
    ).toBe("未找到结果。");
    await search(popup, "");
    expect(candidateLabels(popup)).toEqual(["爱情动作片", "喜剧片"]);
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("returns focus to the trigger on Escape and starts the next opening with an empty search", async () => {
    const wrapper = controlled({
      options: [
        { label: "运行中", value: "running" },
        { label: "已暂停", value: "paused" },
      ],
      modelValue: [],
    });
    const { trigger, popup } = await openFilter(wrapper);
    const input = await search(popup, "运行");
    input.focus();
    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );
    await settle();
    await vi.waitFor(() => {
      expect(trigger.attributes("aria-expanded")).toBe("false");
      expect(document.activeElement).toBe(trigger.element);
    });
    const reopened = await openFilter(wrapper);
    expect(reopened.popup.querySelector<HTMLInputElement>("input")?.value).toBe(
      "",
    );
    expect(candidateLabels(reopened.popup)).toEqual(["运行中", "已暂停"]);
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });
});
