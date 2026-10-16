// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import { describe, expect, it, vi } from "vitest";
import Combobox from "./Combobox.vue";

const i18n = createI18n({ legacy: false, locale: "zh-CN", messages: { "zh-CN": { common: { selectSearch: "搜索选项", selectEmpty: "没有匹配的选项", open: "打开" } } } });

const stubs = {
  Popover: { template: "<div><slot /></div>" },
  PopoverAnchor: { template: "<div><slot /></div>" },
  PopoverTrigger: { template: "<div><slot /></div>" },
  PopoverContent: { template: "<div><slot /></div>" },
  InputGroup: { template: '<div data-slot="input-group"><slot /></div>' },
  InputGroupAddon: { template: '<div><slot /></div>' },
  InputGroupButton: {
    props: ["disabled"],
    template: '<button type="button" :disabled="disabled"><slot /></button>',
  },
  InputGroupInput: {
    props: ["modelValue", "placeholder", "readonly", "disabled"],
    emits: ["update:modelValue", "click", "focus", "keydown"],
    template: '<input data-slot="input-group-control" :value="modelValue" :placeholder="placeholder" :readonly="readonly" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" @click="$emit(\'click\')" @focus="$emit(\'focus\', $event)" @keydown="$emit(\'keydown\', $event)" />',
  },
  Command: { template: "<div><slot /></div>" },
  CommandList: { template: "<div><slot /></div>" },
  CommandGroup: { template: "<div><slot /></div>" },
  CommandItem: {
    template:
      '<button :id="`option-${value}`" :disabled="disabled" @click="$emit(\'select\')"><slot /></button>',
    props: ["disabled", "value"],
    emits: ["select"],
  },
};

describe("Combobox", () => {
  it("renders a combobox trigger with disabled option support", () => {
    const wrapper = mount(Combobox, {
      props: {
        options: [{ label: "OpenAI", value: "openai", disabled: true }],
      },
      global: { stubs, plugins: [i18n] },
    });
    expect(wrapper.get('[role="combobox"]').attributes("aria-expanded")).toBe(
      "false",
    );
    expect(wrapper.get('[role="combobox"]').attributes("aria-haspopup")).toBe(
      "listbox",
    );
    expect(wrapper.get('[role="combobox"]').attributes("aria-autocomplete")).toBe(
      "list",
    );
    expect(wrapper.get('[role="combobox"]').element.disabled).toBe(false);
  });

  it("accepts a custom value on Enter when enabled", async () => {
    const wrapper = mount(Combobox, {
      props: { allowCustomValue: true, options: [] },
      global: { stubs, plugins: [i18n] },
    });
    await wrapper.get('[role="combobox"]').trigger("click");
    const input = wrapper.find('[data-slot="input-group-control"]');
    await input.setValue("custom-model");
    await input.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([
      "custom-model",
    ]);
  });

  it("renders only selectable leaf options when groups are provided", () => {
    const wrapper = mount(Combobox, {
      props: {
        options: [
          { label: "Cloud", children: [{ label: "OpenAI", value: "openai" }] },
        ],
      },
      global: { stubs, plugins: [i18n] },
    });

    expect(wrapper.findAll("button")).toHaveLength(2);
    expect(wrapper.text()).toContain("OpenAI");
    expect(wrapper.text()).toContain("Cloud");
  });

  it("searches labels and values, renders descriptions/icons, and restores selection on Escape", async () => {
    const wrapper = mount(Combobox, {
      props: {
        modelValue: "openai",
        options: [
          { label: "OpenAI", value: "openai", icon: "lucide:cloud" },
          {
            label: "Google",
            value: "gemini",
            description: "备用渠道",
            icon: "lucide:cloud",
          },
        ],
        showSelectedIcon: true,
        ariaLabel: "提供商",
        id: "provider",
        name: "provider",
      },
      global: { stubs, plugins: [i18n] },
    });

    expect(wrapper.get('[role="combobox"]').attributes("aria-label")).toBe(
      "提供商",
    );
    expect(wrapper.get('[role="combobox"]').attributes("id")).toBe("provider");
    expect(wrapper.get('[data-slot="combobox-selected-icon"]')).toBeTruthy();
    await wrapper.get('[role="combobox"]').trigger("mousedown");
    await wrapper.get('[role="combobox"]').trigger("click");
    expect(wrapper.get('[role="combobox"]').attributes("aria-controls")).toMatch(
      /^combobox-list-/,
    );
    expect(wrapper.get('[role="combobox"]').attributes("aria-activedescendant")).toBe(
      "option-OpenAI openai",
    );
    const input = wrapper.get('[data-slot="input-group-control"]');
    const focusSpy = vi.spyOn(HTMLInputElement.prototype, "focus");
    focusSpy.mockClear();
    await input.setValue("gemini");
    expect(wrapper.text()).toContain("Google");
    expect(wrapper.text()).toContain("备用渠道");
    expect(
      wrapper
        .findAll("button")
        .filter((button) => !button.attributes("role"))
        .map((button) => button.text()),
    ).not.toContain("OpenAI");
    await input.trigger("keydown", { key: "Escape" });
    expect((wrapper.get('[role="combobox"]').element as HTMLInputElement).value).toBe("OpenAI");
    expect(wrapper.get('[role="combobox"]').attributes("aria-expanded")).toBe(
      "false",
    );
    expect(focusSpy).toHaveBeenCalled();
    focusSpy.mockRestore();
  });

  it("renders parent group labels and keeps matching hierarchy during search", async () => {
    const wrapper = mount(Combobox, {
      props: {
        options: [
          {
            label: "内容",
            children: [
              { label: "文章", value: "articles" },
              {
                label: "媒体",
                children: [{ label: "视频", value: "videos", disabled: true }],
              },
            ],
          },
        ],
      },
      global: { stubs, plugins: [i18n] },
    });
    await wrapper.get('[role="combobox"]').trigger("click");
    expect(
      wrapper.find('[data-slot="combobox-option-group"]').text(),
    ).toContain("内容");
    expect(
      wrapper.find('[data-depth="2"]').attributes("disabled"),
    ).toBeDefined();
    await wrapper.get('[data-slot="input-group-control"]').setValue("视频");
    expect(wrapper.text()).toContain("媒体");
    expect(wrapper.text()).toContain("视频");
    expect(wrapper.text()).not.toContain("文章");
  });

  it("keeps leaf indentation, empty feedback, and normal selection", async () => {
    const wrapper = mount(Combobox, {
      props: {
        options: [{ label: "内容", children: [{ label: "文章", value: "articles" }] }],
        emptyText: "没有匹配渠道",
      },
      global: { stubs, plugins: [i18n] },
    });
    await wrapper.get('[role="combobox"]').trigger("click");
    expect(wrapper.find('[data-depth="1"]').attributes("style")).toContain("padding-left");
    await wrapper.get('[data-slot="input-group-control"]').setValue("不存在");
    expect(wrapper.text()).toContain("没有匹配渠道");
    await wrapper.get('[data-slot="input-group-control"]').setValue("文章");
    expect(wrapper.text()).toContain("文章");
  });

  it("does not open on focus by default and opens when requested", async () => {
    const closed = mount(Combobox, {
      props: { options: [{ label: "A", value: "a" }] },
      global: { stubs, plugins: [i18n] },
    });
    await closed.get('[role="combobox"]').trigger("focus");
    expect(closed.get('[role="combobox"]').attributes("aria-expanded")).toBe(
      "false",
    );
    await closed.get('[role="combobox"]').trigger("click");
    expect(closed.get('[role="combobox"]').attributes("aria-expanded")).toBe(
      "true",
    );

    const open = mount(Combobox, {
      props: { openOnFocus: true, options: [{ label: "A", value: "a" }] },
      global: { stubs, plugins: [i18n] },
    });
    await open.get('[role="combobox"]').trigger("focus");
    expect(open.get('[role="combobox"]').attributes("aria-expanded")).toBe(
      "true",
    );
  });

  it("does not expose an active descendant when every leaf is disabled", async () => {
    const wrapper = mount(Combobox, {
      props: {
        options: [
          { label: "Disabled A", value: "a", disabled: true },
          { label: "Disabled B", value: "b", disabled: true },
        ],
      },
      global: { stubs, plugins: [i18n] },
    });

    await wrapper.get('[role="combobox"]').trigger("click");

    expect(wrapper.get('[role="combobox"]').attributes("aria-activedescendant")).toBeUndefined();
    expect(wrapper.findAll('[data-combobox-option-key]').some((option) => option.classes("bg-accent"))).toBe(false);
  });

  it("keeps keyboard navigation position while the popup is already open", async () => {
    const wrapper = mount(Combobox, {
      props: {
        options: [
          { label: "A", value: "a" },
          { label: "B", value: "b" },
          { label: "C", value: "c" },
        ],
      },
      global: { stubs, plugins: [i18n] },
    });
    const input = wrapper.get('[role="combobox"]');

    await input.trigger("click");
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "ArrowDown" });

    expect(input.attributes("aria-activedescendant")).toBe("option-C c");
  });

  it("does not reopen from openOnFocus while restoring focus after selection", async () => {
    const wrapper = mount(Combobox, {
      props: {
        openOnFocus: true,
        options: [
          { label: "A", value: "a" },
          { label: "B", value: "b" },
        ],
      },
      global: { stubs, plugins: [i18n] },
    });
    const input = wrapper.get('[role="combobox"]');

    await input.trigger("click");
    const optionB = wrapper.findAll("button").find((button) => button.text().includes("B"));
    expect(optionB).toBeDefined();
    await optionB!.trigger("click");
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    expect(input.attributes("aria-expanded")).toBe("false");
  });
});
