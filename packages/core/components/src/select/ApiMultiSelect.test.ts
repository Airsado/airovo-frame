import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import { afterEach, describe, expect, it, vi } from "vitest";
import ApiMultiSelect from "./ApiMultiSelect.vue";
import type { ApiSelectContext } from "./api-select";
import type { SelectOption } from "./options";

const stubs = {
  Popover: { template: "<div><slot /></div>" },
  PopoverAnchor: { template: "<div><slot /></div>" },
  PopoverContent: { template: "<div><slot /></div>" },
  Command: { template: "<div><slot /></div>" },
  CommandList: { template: '<div role="listbox"><slot /></div>' },
  CommandGroup: { template: "<div><slot /></div>" },
  CommandItem: {
    props: ["value", "disabled"],
    emits: ["select"],
    template:
      '<button data-option :disabled="disabled" @click="$emit(\'select\')"><slot /></button>',
  },
};
const wrappers: VueWrapper[] = [];
function setup(props: Record<string, unknown>) {
  const wrapper = mount(ApiMultiSelect, {
    props: props as never,
    global: {
      stubs,
      plugins: [
        createI18n({
          legacy: false,
          locale: "zh-CN",
          messages: { "zh-CN": {} },
        }),
      ],
    },
  });
  wrappers.push(wrapper);
  return wrapper;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  vi.useRealTimers();
});

describe("ApiMultiSelect", () => {
  it("loads on first open, searches locally, displays chips, and forwards form attrs to the input", async () => {
    const api = vi.fn(async () => ({
      options: [
        { label: "Alpha", value: "alpha", description: "HLS" },
        { label: "Beta", value: "beta" },
      ],
      hasMore: false,
      hint: "Known values",
    }));
    const wrapper = setup({
      api,
      modelValue: ["legacy"],
      id: "sources",
      name: "sources",
      "aria-label": "Sources",
    });
    expect(api).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("legacy");
    const input = wrapper.get("input");
    expect(input.attributes()).toMatchObject({
      id: "sources",
      name: "sources",
      "aria-label": "Sources",
    });
    await input.trigger("click");
    await flushPromises();
    expect(api).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain("Known values");
    await input.setValue("HLS");
    expect(wrapper.findAll("[data-option]")).toHaveLength(1);
    await wrapper.get("[data-option]").trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([
      ["legacy", "alpha"],
    ]);
    expect(input.attributes("aria-expanded")).toBe("true");
    expect(api).toHaveBeenCalledTimes(1);
  });

  it("keeps chosen labels when remote search returns unrelated rows and ignores stale responses", async () => {
    vi.useFakeTimers();
    const old = deferred<SelectOption[]>();
    const contexts: ApiSelectContext[] = [];
    const api = vi.fn((context: ApiSelectContext) => {
      contexts.push(context);
      if (context.search === "old") return old.promise;
      return Promise.resolve(
        context.search
          ? [{ label: "Server-ranked result", value: "other" }]
          : [{ label: "Friendly name", value: "chosen" }],
      );
    });
    const wrapper = setup({
      api,
      modelValue: ["chosen"],
      remote: true,
      debounce: 20,
    });
    const input = wrapper.get("input");
    await input.trigger("focus");
    await flushPromises();
    expect(wrapper.get('[data-slot="combobox-chip"]').text()).toContain(
      "Friendly name",
    );
    await input.setValue("old");
    await vi.advanceTimersByTimeAsync(20);
    await input.setValue("new");
    expect(contexts[1]?.signal.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(20);
    await flushPromises();
    expect(wrapper.get("[data-option]").text()).toContain(
      "Server-ranked result",
    );
    expect(wrapper.get('[data-slot="combobox-chip"]').text()).toContain(
      "Friendly name",
    );
    old.resolve([{ label: "Stale", value: "stale" }]);
    await flushPromises();
    expect(wrapper.text()).not.toContain("Stale");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("shows loading/error/retry and allows an explicitly permitted custom fallback", async () => {
    const pending = deferred<SelectOption[]>();
    const api = vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce([]);
    const wrapper = setup({
      api,
      allowCreate: true,
      errorText: "Could not load sources",
    });
    const input = wrapper.get("input");
    await input.trigger("click");
    expect(wrapper.get('[role="status"]').text()).toContain("加载中");
    expect(input.attributes("aria-busy")).toBe("true");
    pending.reject(new Error("offline"));
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain(
      "Could not load sources",
    );
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "重试")!
      .trigger("click");
    await flushPromises();
    expect(wrapper.emitted("load-error")).toHaveLength(1);
    await input.setValue("custom");
    await input.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([["custom"]]);
  });

  it("resets a changed loader and aborts requests without clearing selected unknown values", async () => {
    const pending = deferred<SelectOption[]>();
    let oldSignal: AbortSignal | undefined;
    const api = vi.fn((context: ApiSelectContext) => {
      oldSignal = context.signal;
      return pending.promise;
    });
    const wrapper = setup({ api, modelValue: ["saved"] });
    await wrapper.get("input").trigger("click");
    const newer = vi.fn(async () => [{ label: "New source", value: "new" }]);
    await wrapper.setProps({ api: newer });
    await flushPromises();
    expect(oldSignal?.aborted).toBe(true);
    pending.resolve([{ label: "Obsolete source", value: "old" }]);
    await flushPromises();
    expect(wrapper.text()).not.toContain("Obsolete source");
    expect(wrapper.get('[data-slot="combobox-chip"]').text()).toContain(
      "saved",
    );
    expect(wrapper.get("[data-option]").text()).toContain("New source");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("does not load while disabled and cancels on close or unmount", async () => {
    vi.useFakeTimers();
    const contexts: ApiSelectContext[] = [];
    const api = vi.fn((context: ApiSelectContext) => {
      contexts.push(context);
      return new Promise<SelectOption[]>(() => {});
    });
    const wrapper = setup({ api, disabled: true, remote: true, debounce: 20 });
    const input = wrapper.get("input");
    await input.trigger("focus");
    expect(api).not.toHaveBeenCalled();
    await wrapper.setProps({ disabled: false });
    await input.trigger("focus");
    expect(api).toHaveBeenCalledTimes(1);
    await input.trigger("keydown", { key: "Escape" });
    expect(contexts[0]?.signal.aborted).toBe(true);
    await input.trigger("click");
    await input.setValue("next");
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(20);
    expect(contexts[1]?.signal.aborted).toBe(true);
    expect(api).toHaveBeenCalledTimes(2);
  });

  it("loads the next page and retries failed appends without discarding current options", async () => {
    const api = vi
      .fn()
      .mockResolvedValueOnce({
        options: [{ label: "First", value: "1" }],
        hasMore: true,
      })
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce({
        options: [{ label: "Second", value: "2" }],
        hasMore: false,
      });
    const wrapper = setup({ api });
    await wrapper.get("input").trigger("click");
    await flushPromises();
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "加载更多")!
      .trigger("click");
    await flushPromises();
    expect(wrapper.findAll("[data-option]")).toHaveLength(1);
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "重试")!
      .trigger("click");
    await flushPromises();
    expect(api.mock.calls.map((call) => call[0].page)).toEqual([1, 2, 2]);
    expect(wrapper.findAll("[data-option]")).toHaveLength(2);
  });
});
