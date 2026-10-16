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
    props: ["asChild"],
    template: '<div data-stub="tooltip-trigger" :data-as-child="String(asChild)"><slot /></div>',
  },
  TooltipContent: {
    props: ["side", "sideOffset", "align", "alignOffset"],
    template: '<div v-bind="$attrs" data-stub="tooltip-content" :data-align="align" :data-align-offset="alignOffset"><slot /></div>',
  },
  Popover: { template: '<div v-bind="$attrs" data-stub="popover"><slot /></div>' },
  PopoverTrigger: {
    props: ["disabled", "asChild"],
    template: '<div v-bind="$attrs" data-stub="popover-trigger" :data-as-child="String(asChild)"><slot /></div>',
  },
  PopoverContent: {
    template: '<div v-bind="$attrs" data-stub="popover-content"><slot /></div>',
  },
};

describe("framework overlay compositions", () => {
  it("exposes new-api tooltip defaults and trigger/content slots", () => {
    const wrapper = mount(FrameworkTooltip, {
      props: { content: "说明", align: "end", alignOffset: 2 },
      slots: { trigger: "<button>?</button>" },
      global: { stubs },
    });
    expect(wrapper.get('[data-slot="framework-tooltip"]')).toBeTruthy();
    expect(
      wrapper.get('[data-slot="framework-tooltip-content"]').classes(),
    ).toEqual(expect.arrayContaining(["max-w-xs", "inline-flex", "gap-1.5"]));
    expect(wrapper.get('[data-stub="tooltip-trigger"]').attributes("data-as-child")).toBeDefined();
    expect(wrapper.get('[data-slot="framework-tooltip-content"]').attributes("data-align")).toBe("end");
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
    ).toEqual(expect.arrayContaining([
      "bg-popover",
      "text-popover-foreground",
      "z-50",
      "flex",
      "w-72",
      "gap-2.5",
      "rounded-lg",
      "p-2.5",
      "shadow-md",
      "ring-1",
      "ring-foreground/10",
      "duration-100",
    ]));
    expect(wrapper.get('[data-slot="framework-popover"]')).toBeTruthy();
    expect(wrapper.get('[data-slot="framework-popover-trigger"]')).toBeTruthy();
    expect(wrapper.get('[data-stub="popover-trigger"]').attributes("data-as-child")).toBeDefined();
  });

  it("keeps the same surface contract for an uncontrolled popover", () => {
    const wrapper = mount(FrameworkPopover, {
      props: { defaultOpen: true },
      slots: { trigger: "<button>打开</button>", default: "<p>内容</p>" },
      global: { stubs },
    });
    expect(wrapper.get('[data-slot="framework-popover"]')).toBeTruthy();
    expect(wrapper.get('[data-slot="framework-popover-content"]').classes()).toContain("bg-popover");
  });
});
