// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import FrameworkPopover from "./FrameworkPopover.vue";
import FrameworkTooltip from "./FrameworkTooltip.vue";

const stubs = {
  TooltipProvider: {
    template: '<div data-stub="tooltip-provider"><slot /></div>',
  },
  Tooltip: {
    props: ["disabled"],
    template: '<div data-stub="tooltip"><slot /></div>',
  },
  TooltipTrigger: {
    template: '<div data-stub="tooltip-trigger"><slot /></div>',
  },
  TooltipContent: {
    props: ["side", "sideOffset"],
    template: '<div v-bind="$attrs" data-stub="tooltip-content"><slot /></div>',
  },
  Popover: { template: '<div data-stub="popover"><slot /></div>' },
  PopoverTrigger: {
    props: ["disabled"],
    template: '<div data-stub="popover-trigger"><slot /></div>',
  },
  PopoverContent: {
    template: '<div v-bind="$attrs" data-stub="popover-content"><slot /></div>',
  },
};

describe("framework overlay compositions", () => {
  it("exposes new-api tooltip defaults and trigger/content slots", () => {
    const wrapper = mount(FrameworkTooltip, {
      props: { content: "说明" },
      slots: { trigger: "<button>?</button>" },
      global: { stubs },
    });
    expect(wrapper.get('[data-slot="framework-tooltip"]')).toBeTruthy();
    expect(
      wrapper.get('[data-slot="framework-tooltip-content"]').classes(),
    ).toContain("max-w-xs");
    expect(wrapper.text()).toContain("说明");
  });

  it("exposes controlled popover state and new-api surface classes", () => {
    const wrapper = mount(FrameworkPopover, {
      props: { open: true, modal: false },
      slots: { trigger: "<button>打开</button>", default: "<p>内容</p>" },
      global: { stubs },
    });
    expect(
      wrapper.get('[data-slot="framework-popover-content"]').classes(),
    ).toEqual(expect.arrayContaining(["w-72", "rounded-lg", "p-2.5"]));
  });
});
