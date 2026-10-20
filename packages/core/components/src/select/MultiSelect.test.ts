// @vitest-environment happy-dom
import { shallowMount } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import { describe, expect, it } from "vitest";
import MultiSelect from "./MultiSelect.vue";

const stubs = {
  Popover: { template: "<div><slot /></div>" },
  PopoverAnchor: { template: "<div><slot /></div>" },
  PopoverContent: { template: "<div><slot /></div>" },
  Command: { template: "<div><slot /></div>" },
  CommandInput: {
    props: ["modelValue", "placeholder"],
    emits: ["update:modelValue", "keydown"],
    template:
      '<input data-command-input :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown="$emit(\'keydown\', $event)" />',
  },
  CommandList: { template: "<div><slot /></div>" },
  CommandEmpty: { template: "<div><slot /></div>" },
  CommandGroup: { template: "<div><slot /></div>" },
  CommandItem: {
    props: ["disabled"],
    emits: ["select"],
    template:
      '<button :disabled="disabled" @click="$emit(\'select\')"><slot /></button>',
  },
  Check: true,
  ChevronDown: true,
  X: true,
  Icon: true,
};

describe("MultiSelect", () => {
  const global = {
    stubs,
    plugins: [
      createI18n({
        legacy: false,
        locale: "en-US",
        messages: {
          "en-US": {
            common: {
              multiSelectPlaceholder: "Select items",
              multiSelectCreate: "Add “{value}”",
              multiSelectEmpty: "No items",
              remove: "Remove",
              showAll: "Show all",
              collapse: "Collapse",
            },
          },
        },
      }),
    ],
  };

  it("uses the new-api chips/input surface and keeps hidden values compact", () => {
    const wrapper = shallowMount(MultiSelect, {
      global,
      props: {
        options: [
          { label: "One", value: "one", hint: "Primary" },
          { label: "Two", value: "two" },
        ],
        modelValue: ["one", "two"],
        maxVisibleChips: 1,
      },
    });
    expect(wrapper.get('[data-slot="combobox-chips"]').classes()).toEqual(
      expect.arrayContaining(["rounded-lg", "border-input", "bg-transparent"]),
    );
    expect(wrapper.get("input").attributes("aria-label")).toBe("Select items");
    expect(wrapper.get("input").attributes("placeholder")).toBeUndefined();
    expect(wrapper.text()).toContain("+1");
  });

  it("forwards id to the native input and supports a selected summary renderer", () => {
    const wrapper = shallowMount(MultiSelect, {
      global,
      props: {
        id: "channels",
        options: [{ label: "One", value: "one" }],
        modelValue: ["one"],
        renderSelectedSummary: (values) => `${values.length} selected`,
      },
    });

    expect(wrapper.get("input").attributes("id")).toBe("channels");
    expect(wrapper.findComponent({ name: "MultiSelectSummary" }).exists()).toBe(
      true,
    );
  });

  it("renders the selected-summary slot with the current values", () => {
    const wrapper = shallowMount(MultiSelect, {
      global,
      props: { modelValue: ["one", "two"] },
      slots: {
        "selected-summary": ({ values }: { values: string[] }) =>
          `${values.length} selected`,
      },
    });

    expect(wrapper.text()).toContain("2 selected");
  });

  it("selects existing options from the inline input with Enter", async () => {
    const wrapper = shallowMount(MultiSelect, {
      global,
      props: {
        options: [
          { label: "One", value: "one" },
          { label: "Two", value: "two" },
        ],
        modelValue: ["one"],
      },
    });
    const input = wrapper.get("input");
    await input.setValue("Two");
    await input.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([
      ["one", "two"],
    ]);
  });

  it("creates a custom value and handles comma separated input", async () => {
    const wrapper = shallowMount(MultiSelect, {
      global,
      props: { allowCreate: true, modelValue: [] },
    });
    const input = wrapper.get("input");
    await input.setValue("alpha,beta,");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([
      ["alpha", "beta"],
    ]);
    await wrapper.setProps({ modelValue: ["alpha", "beta"] });
    await input.setValue("gamma");
    await input.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([
      ["alpha", "beta", "gamma"],
    ]);
  });

  it("does not submit the form for Enter with no options or modify values during IME composition", async () => {
    const wrapper = shallowMount(MultiSelect, {
      global,
      props: { allowCreate: true },
    });
    const input = wrapper.get("input");
    const empty = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    input.element.dispatchEvent(empty);
    expect(empty.defaultPrevented).toBe(true);
    await input.trigger("compositionstart");
    await input.setValue("中文,");
    await input.trigger("keydown", { key: "Enter", isComposing: true });
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    await input.trigger("compositionend");
    await input.setValue("中文");
    await input.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([["中文"]]);
  });

  it("forwards native form and aria attributes and preserves unknown selected values", () => {
    const wrapper = shallowMount(MultiSelect, {
      global,
      attrs: {
        name: "sources",
        "aria-label": "播放线路",
        "aria-describedby": "help",
        "aria-invalid": "true",
      },
      props: {
        modelValue: ["unknown"],
        selectedOptions: [{ label: "Known label", value: "known" }],
      },
    });
    expect(wrapper.text()).toContain("unknown");
    expect(wrapper.get("input").attributes()).toMatchObject({
      name: "sources",
      "aria-label": "播放线路",
      "aria-describedby": "help",
      "aria-invalid": "true",
    });
  });

  it("keeps an opened popup open on repeated input clicks and disables all mutation paths", async () => {
    const wrapper = shallowMount(MultiSelect, {
      global,
      props: {
        modelValue: ["one"],
        allowCreate: true,
        options: [{ label: "Two", value: "two" }],
      },
    });
    const input = wrapper.get("input");
    await input.trigger("focus");
    await input.trigger("click");
    await input.trigger("click");
    expect(input.attributes("aria-expanded")).toBe("true");
    expect(wrapper.emitted("open-change")).toEqual([[true]]);
    await wrapper.setProps({ disabled: true });
    expect(input.attributes("aria-expanded")).toBe("false");
    expect(
      wrapper.get('[data-slot="combobox-chip-remove"]').attributes("disabled"),
    ).toBeDefined();
    await input.setValue("other");
    await input.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("skips disabled options for the initial keyboard selection", async () => {
    const wrapper = shallowMount(MultiSelect, {
      global,
      props: {
        options: [
          { label: "Unavailable", value: "no", disabled: true },
          { label: "Available", value: "yes" },
        ],
      },
    });
    await wrapper.get("input").trigger("keydown", { key: "ArrowDown" });
    await wrapper.get("input").trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([["yes"]]);
  });
});
