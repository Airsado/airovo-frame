import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import { afterEach, describe, expect, it, vi } from "vitest";
import ApiSelect from "./ApiSelect.vue";
import type { ApiSelectContext } from "./api-select";
import type { SelectOption } from "./options";

const stubs = {
  Popover: { template: "<div><slot /></div>" },
  PopoverAnchor: { template: "<div><slot /></div>" },
  PopoverContent: { template: "<div><slot /></div>" },
  InputGroup: { template: "<div><slot /></div>" },
  InputGroupAddon: { template: "<div><slot /></div>" },
  InputGroupInput: {
    props: ["modelValue", "placeholder", "readonly", "disabled"],
    template:
      '<input :value="modelValue" :placeholder="placeholder" :readonly="readonly" :disabled="disabled" />',
  },
  Command: { template: "<div><slot /></div>" },
  CommandList: { template: '<div role="listbox"><slot /></div>' },
  CommandGroup: { template: "<div><slot /></div>" },
  CommandItem: {
    props: ["value", "disabled"],
    emits: ["select"],
    template:
      '<button data-option :id="`option-${value}`" :disabled="disabled" @click="$emit(\'select\')"><slot /></button>',
  },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

const wrappers: VueWrapper[] = [];
function setup(props: Record<string, unknown>) {
  const wrapper = mount(ApiSelect, {
    props: props as never,
    attachTo: document.body,
    global: {
      plugins: [
        createI18n({
          legacy: false,
          locale: "zh-CN",
          messages: { "zh-CN": {} },
        }),
      ],
      stubs,
    },
  });
  wrappers.push(wrapper);
  return wrapper;
}

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("ApiSelect", () => {
  it("cancels selected-label lookups when disabled and on unmount", async () => {
    const signals: AbortSignal[] = [];
    const pending = deferred<SelectOption | undefined>();
    const resolveSelected = vi.fn(
      (_value: string, context: { signal: AbortSignal }) => {
        signals.push(context.signal);
        return pending.promise;
      },
    );
    const wrapper = setup({
      api: vi.fn(async () => []),
      resolveSelected,
      modelValue: "1",
    });
    await wrapper.setProps({ disabled: true });
    expect(signals[0]?.aborted).toBe(true);
    await wrapper.setProps({ disabled: false });
    wrapper.unmount();
    expect(signals[1]?.aborted).toBe(true);
    pending.resolve({ value: "1", label: "Late label" });
    await flushPromises();
    expect(wrapper.emitted("load-error")).toBeUndefined();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });
  it("resolves selected IDs directly and ignores stale selection lookups", async () => {
    const old = deferred<SelectOption | undefined>();
    const resolveSelected = vi.fn((value: string) =>
      value === "1"
        ? old.promise
        : Promise.resolve({ value, label: "Current selection" }),
    );
    const api = vi.fn(async () => []);
    const wrapper = setup({ api, resolveSelected, modelValue: "1" });
    expect(api).not.toHaveBeenCalled();
    await wrapper.setProps({ modelValue: "2" });
    await flushPromises();
    expect(
      wrapper.get<HTMLInputElement>('[role="combobox"]').element.value,
    ).toBe("Current selection");
    old.resolve({ value: "1", label: "Obsolete" });
    await flushPromises();
    expect(
      wrapper.get<HTMLInputElement>('[role="combobox"]').element.value,
    ).toBe("Current selection");
    expect(api).not.toHaveBeenCalled();
  });

  it("retries a failed selected-name lookup without changing its ID", async () => {
    const resolveSelected = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ value: "19", label: "Recovered name" });
    const api = vi.fn(async () => []);
    const wrapper = setup({ api, resolveSelected, modelValue: "19" });
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain("名称未能加载");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "重试")!
      .trigger("click");
    await flushPromises();
    expect(
      wrapper.get<HTMLInputElement>('[role="combobox"]').element.value,
    ).toBe("Recovered name");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    expect(api).not.toHaveBeenCalled();
  });

  it("loads additional pages, keeps existing choices on failure and retries the same page", async () => {
    const api = vi
      .fn()
      .mockResolvedValueOnce({
        options: [{ value: "1", label: "First" }],
        hasMore: true,
      })
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        options: [{ value: "2", label: "Second" }],
        hasMore: false,
      });
    const wrapper = setup({ api, remote: true });
    await wrapper.get('[role="combobox"]').trigger("click");
    await flushPromises();
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "加载更多")!
      .trigger("click");
    await flushPromises();
    expect(wrapper.findAll("[data-option]")).toHaveLength(1);
    expect(wrapper.text()).toContain("First");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "重试")!
      .trigger("click");
    await flushPromises();
    expect(api.mock.calls.map((call) => call[0].page)).toEqual([1, 2, 2]);
    expect(wrapper.findAll("[data-option]")).toHaveLength(2);
    expect(wrapper.text()).toContain("Second");
  });

  it("loads lazily, filters a full list locally, and selects an exact string ID", async () => {
    const id = "2105964780501078021";
    const api = vi.fn(async (_context: ApiSelectContext) => [
      { label: "Example source", value: id },
      { label: "Another", value: "2" },
    ]);
    const wrapper = setup({ api, ariaLabel: "采集站", id: "site-id" });
    expect(api).not.toHaveBeenCalled();
    const input = wrapper.get<HTMLInputElement>('[role="combobox"]');
    expect(input.attributes("aria-label")).toBe("采集站");
    expect(input.attributes("id")).toBe("site-id");
    await input.trigger("click");
    await flushPromises();
    expect(api).toHaveBeenCalledTimes(1);
    expect(api.mock.calls[0]?.[0]).toMatchObject({ search: "" });
    await input.setValue("Example");
    expect(wrapper.findAll("[data-option]")).toHaveLength(1);
    expect(api).toHaveBeenCalledTimes(1);
    await wrapper.get("[data-option]").trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([[id]]);
  });

  it("shows loading feedback without emitting a model change and permits retry on failure", async () => {
    const first = deferred<SelectOption[]>();
    const api = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce([{ label: "Recovered", value: "1" }]);
    const wrapper = setup({ api });
    await wrapper.get('[role="combobox"]').trigger("click");
    expect(wrapper.get('[role="status"]').text()).toContain("加载中");
    expect(wrapper.get('[role="combobox"]').attributes("aria-busy")).toBe(
      "true",
    );
    first.reject(new Error("offline"));
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain("选项加载失败");
    expect(wrapper.emitted("load-error")).toHaveLength(1);
    const retry = wrapper
      .findAll("button")
      .find((button) => button.text() === "重试")!;
    await retry.trigger("click");
    await flushPromises();
    expect(wrapper.get("[data-option]").text()).toContain("Recovered");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("debounces remote searches and ignores stale results even when the API ignores abort", async () => {
    vi.useFakeTimers();
    const old = deferred<SelectOption[]>();
    const fresh = deferred<SelectOption[]>();
    const contexts: ApiSelectContext[] = [];
    const api = vi.fn((context: ApiSelectContext) => {
      contexts.push(context);
      return context.search === "older"
        ? old.promise
        : context.search === "newer"
          ? fresh.promise
          : Promise.resolve([]);
    });
    const wrapper = setup({ api, remote: true, debounce: 100 });
    const input = wrapper.get('[role="combobox"]');
    await input.trigger("click");
    await flushPromises();
    await input.setValue("older");
    await vi.advanceTimersByTimeAsync(99);
    expect(api).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await input.setValue("newer");
    expect(contexts[1]?.signal.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(100);
    fresh.resolve([{ label: "Server ranked result", value: "latest" }]);
    await flushPromises();
    expect(wrapper.get("[data-option]").text()).toContain(
      "Server ranked result",
    );
    old.resolve([{ label: "Obsolete", value: "old" }]);
    await flushPromises();
    expect(wrapper.text()).not.toContain("Obsolete");
    expect(wrapper.get("[data-option]").text()).toContain(
      "Server ranked result",
    );
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("hydrates the initial label and retains it separately when remote results exclude it", async () => {
    vi.useFakeTimers();
    const id = "2105964780501078021";
    const api = vi.fn(async ({ search }: ApiSelectContext) =>
      search
        ? [{ label: "Different result", value: "2" }]
        : [{ label: "Current source", value: id }],
    );
    const wrapper = setup({ api, modelValue: id, remote: true, debounce: 0 });
    await flushPromises();
    const input = wrapper.get<HTMLInputElement>('[role="combobox"]');
    expect(input.element.value).toBe("Current source");
    await input.trigger("click");
    await flushPromises();
    await input.setValue("different");
    await vi.advanceTimersByTimeAsync(0);
    await flushPromises();
    expect(wrapper.findAll("[data-option]")).toHaveLength(1);
    expect(wrapper.get("[data-option]").text()).not.toContain("Current source");
    await input.trigger("keydown", { key: "Escape" });
    expect(input.element.value).toBe("Current source");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("cancels pending requests on close/unmount and pending debounce on unmount", async () => {
    vi.useFakeTimers();
    const pending = deferred<SelectOption[]>();
    const contexts: ApiSelectContext[] = [];
    const api = vi.fn((context: ApiSelectContext) => {
      contexts.push(context);
      return pending.promise;
    });
    const wrapper = setup({ api, remote: true, debounce: 100 });
    const input = wrapper.get('[role="combobox"]');
    await input.trigger("click");
    await input.trigger("keydown", { key: "Escape" });
    expect(contexts[0]?.signal.aborted).toBe(true);
    await input.trigger("click");
    await input.setValue("pending");
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(100);
    expect(api).toHaveBeenCalledTimes(2);
    pending.reject(new Error("aborted"));
    await flushPromises();
    expect(wrapper.emitted("load-error")).toBeUndefined();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("does not load while disabled and does not accept arbitrary IDs", async () => {
    const api = vi.fn(async () => []);
    const wrapper = setup({ api, disabled: true, modelValue: "1" });
    expect(api).not.toHaveBeenCalled();
    const input = wrapper.get('[role="combobox"]');
    await input.trigger("click");
    expect(input.attributes("aria-expanded")).toBe("false");
    await wrapper.setProps({ disabled: false });
    await flushPromises();
    await input.trigger("click");
    await flushPromises();
    await input.setValue("a-made-up-id");
    await input.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("aborts an in-flight request when the selector unmounts", async () => {
    const pending = deferred<SelectOption[]>();
    let signal: AbortSignal | undefined;
    const api = vi.fn((context: ApiSelectContext) => {
      signal = context.signal;
      return pending.promise;
    });
    const wrapper = setup({ api });
    await wrapper.get('[role="combobox"]').trigger("click");
    wrapper.unmount();
    expect(signal?.aborted).toBe(true);
    pending.reject(new Error("request was cancelled"));
    await flushPromises();
    expect(wrapper.emitted("load-error")).toBeUndefined();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });
});
