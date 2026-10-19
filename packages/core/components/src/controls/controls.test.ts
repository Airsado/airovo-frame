// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { Button, Input, Textarea } from "./index";

describe("framework control compositions", () => {
  it("keeps non-submit actions safe inside forms and preserves explicit submit", async () => {
    const submit = vi.fn((event: Event) => event.preventDefault());
    const click = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h("form", { onSubmit: submit }, [
            h(Button, { onClick: click }, () => "Action"),
            h(Button, { type: "submit" }, () => "Save"),
          ]),
      }),
      { attachTo: document.body },
    );
    const buttons = wrapper.findAll("button");
    buttons[0]!.element.click();
    expect(click).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
    expect(buttons[0]!.attributes("type")).toBe("button");
    expect(buttons[1]!.attributes("type")).toBe("submit");
    buttons[1]!.element.click();
    expect(submit).toHaveBeenCalledOnce();
    wrapper.unmount();
  });

  it("preserves asChild links, native attributes, and disabled buttons", () => {
    const click = vi.fn();
    const link = mount(Button, {
      props: { asChild: true, variant: "outline" },
      slots: { default: '<a href="/target">Open</a>' },
    });
    expect(link.element.tagName).toBe("A");
    expect(link.attributes("href")).toBe("/target");
    expect(link.attributes("type")).toBeUndefined();
    const disabled = mount(Button, {
      attrs: { disabled: true, "aria-label": "Wait", onClick: click },
    });
    (disabled.element as HTMLButtonElement).click();
    expect(click).not.toHaveBeenCalled();
    expect(disabled.attributes("aria-label")).toBe("Wait");
    link.unmount();
    disabled.unmount();
  });

  it("allows composite content to opt out of the fixed control height", () => {
    const wrapper = mount(Button, {
      props: { class: "h-auto min-h-0 p-0 whitespace-normal" },
      slots: { default: "<svg /><span>Two<br>lines</span>" },
    });
    expect(wrapper.classes()).toContain("h-auto");
    expect(wrapper.classes()).not.toContain("h-8");
    expect(wrapper.classes()).toContain("whitespace-normal");
    expect(wrapper.classes()).not.toContain("whitespace-nowrap");
    expect(wrapper.classes()).toContain("p-0");
    expect(wrapper.classes()).not.toContain("px-2.5");
    expect(
      wrapper.classes().some((name) => name.startsWith("has-[>svg]:")),
    ).toBe(false);
    expect(wrapper.attributes("data-size")).toBe("default");
    wrapper.unmount();
  });

  it("adds a decorative leading icon without changing the action or accessible label", async () => {
    const click = vi.fn();
    const wrapper = mount(Button, {
      props: { icon: "lucide:plus", size: "sm" },
      attrs: { onClick: click },
      slots: { default: "新增用户" },
    });
    const icon = wrapper.get('[data-slot="button-icon"]');
    expect(icon.attributes("aria-hidden")).toBe("true");
    expect(icon.attributes("data-icon")).toBe("inline-start");
    expect(icon.find("svg").exists()).toBe(true);
    expect(wrapper.element.firstElementChild).toBe(icon.element);
    expect(wrapper.text()).toBe("新增用户");
    await wrapper.trigger("click");
    expect(click).toHaveBeenCalledOnce();
    await wrapper.setProps({ icon: undefined });
    expect(wrapper.find('[data-slot="button-icon"]').exists()).toBe(false);
    expect(wrapper.text()).toBe("新增用户");
    wrapper.unmount();
  });

  it("lets icon and suffix slots override the shorthand while keeping one native button", () => {
    const wrapper = mount(Button, {
      props: { icon: "lucide:plus" },
      slots: {
        icon: () => h("svg", { "data-test": "custom-icon" }),
        default: "导出",
        suffix: () => h("svg", { "data-test": "menu-icon" }),
      },
    });
    expect(wrapper.findAll("svg")).toHaveLength(2);
    expect(
      wrapper.get('[data-slot="button-icon"] svg').attributes("data-test"),
    ).toBe("custom-icon");
    expect(
      wrapper.get('[data-slot="button-suffix"]').attributes("data-icon"),
    ).toBe("inline-end");
    expect(
      wrapper.get('[data-slot="button-suffix"]').attributes("aria-hidden"),
    ).toBe("true");
    expect(wrapper.element.tagName).toBe("BUTTON");
    expect(wrapper.element.querySelectorAll("button")).toHaveLength(0);
    expect(wrapper.text()).toBe("导出");
    wrapper.unmount();
  });

  for (const Control of [Input, Textarea]) {
    it(`${Control.name} keeps zero, clearing, external updates, and blur on the native control`, async () => {
      const value = ref<string | number>(0);
      const blur = vi.fn();
      const wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(Control, {
              modelValue: value.value,
              "onUpdate:modelValue": (next: string | number) => {
                value.value = next;
              },
              id: "control",
              name: "value",
              "aria-invalid": true,
              onBlur: blur,
            }),
        }),
      );
      const input = wrapper.get("input, textarea");
      // happy-dom keeps textarea's numeric value; browsers coerce the same
      // binding to a string. Neither control may erase the meaningful zero.
      expect(String((input.element as HTMLInputElement).value)).toBe("0");
      expect(input.attributes("aria-invalid")).toBe("true");
      await input.setValue("changed");
      expect(value.value).toBe("changed");
      await input.setValue("");
      expect(value.value).toBe("");
      await input.trigger("blur");
      expect(blur).toHaveBeenCalledOnce();
      value.value = "loaded";
      await wrapper.vm.$nextTick();
      expect((input.element as HTMLInputElement).value).toBe("loaded");
      wrapper.unmount();
    });
  }

  it("keeps size and variant metadata while allowing horizontal padding overrides", () => {
    const wrapper = mount(Button, {
      props: { size: "sm", variant: "outline", class: "px-0" },
      slots: { default: "<svg /><span>Compact content</span>" },
    });
    expect(wrapper.attributes("data-size")).toBe("sm");
    expect(wrapper.attributes("data-variant")).toBe("outline");
    expect(wrapper.classes()).toContain("px-0");
    expect(wrapper.classes()).not.toContain("px-2.5");
    expect(
      wrapper.classes().some((name) => name.startsWith("has-[>svg]:")),
    ).toBe(false);
    wrapper.unmount();
  });
});
