// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DOMWrapper,
  flushPromises,
  mount,
  type VueWrapper,
} from "@vue/test-utils";
import { CalendarDate } from "@internationalized/date";
import { createI18n } from "vue-i18n";
import DateRangePicker from "./DateRangePicker.vue";
import DateTimeRangePicker from "./DateTimeRangePicker.vue";
import RangeCalendar from "./RangeCalendar.vue";
import type { DateRangeValue } from "./date-range";

let wrapper: VueWrapper | undefined;
const initial: DateRangeValue = [
  new Date(2026, 9, 19, 10),
  new Date(2026, 9, 19, 11),
];
const global = {
  plugins: [
    createI18n({ legacy: false, locale: "zh-CN", messages: { "zh-CN": {} } }),
  ],
};
afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = "";
});
async function render(props: Record<string, unknown> = {}) {
  wrapper = mount(DateRangePicker, {
    attachTo: document.body,
    props: { modelValue: initial, ...props },
    global,
  });
  await wrapper.get("[data-date-range-trigger]").trigger("click");
  await flushPromises();
  return wrapper;
}
const button = (label: string) =>
  Array.from(document.querySelectorAll("button")).find(
    (item) => item.textContent?.trim() === label,
  )!;
const timeInputs = () =>
  Array.from(
    document.querySelectorAll<HTMLInputElement>('input[type="time"]'),
  ).map((element) => new DOMWrapper(element));

describe("atomic date range picker", () => {
  it("keeps time-range defaults including the clear action through the wrapper", async () => {
    wrapper = mount(DateTimeRangePicker, {
      attachTo: document.body,
      props: { modelValue: initial },
      global,
    });
    await wrapper.get("[data-date-range-trigger]").trigger("click");
    await flushPromises();
    expect(document.querySelectorAll('input[type="time"]')).toHaveLength(2);
    expect(button("清除")).toBeDefined();
    button("清除").click();
    await flushPromises();
    expect(wrapper.emitted("update:modelValue")![0]).toEqual([undefined]);
  });
  it("selects both endpoints through the actual calendar without disabling all cells", async () => {
    const view = await render({
      modelValue: undefined,
      minDate: new Date(2026, 9, 1),
      maxDate: new Date(2026, 9, 31),
      numberOfMonths: 1,
    });
    const start = new DOMWrapper(
      document.querySelector<HTMLButtonElement>('[data-value="2026-10-10"]')!,
    );
    const end = new DOMWrapper(
      document.querySelector<HTMLButtonElement>('[data-value="2026-10-12"]')!,
    );
    expect(start.element.closest("td")!.getAttribute("aria-disabled")).not.toBe(
      "true",
    );
    expect(
      Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          "button[data-outside-view]",
        ),
      ).every((element) => element.tabIndex === -1),
    ).toBe(true);
    await start.trigger("click");
    await flushPromises();
    expect(button("确定").disabled).toBe(true);
    await end.trigger("mouseenter");
    await end.trigger("click");
    await flushPromises();
    expect(button("确定").disabled).toBe(false);
    button("确定").click();
    await flushPromises();
    const range = view.emitted("update:modelValue")![0][0] as DateRangeValue;
    expect(range.map((date) => date.getDate())).toEqual([10, 12]);
  });
  it("discards a draft on cancel and keeps the caller Dates unchanged", async () => {
    const view = await render({ showTime: true });
    const inputs = timeInputs();
    await inputs[0].setValue("09:08:07");
    expect(view.emitted("update:modelValue")).toBeUndefined();
    button("取消").click();
    await flushPromises();
    await view.get("[data-date-range-trigger]").trigger("click");
    await flushPromises();
    expect(
      (document.querySelector('input[type="time"]') as HTMLInputElement).value,
    ).toMatch(/^10:00(:00)?$/);
    expect(initial[0].getHours()).toBe(10);
  });

  it("only emits complete confirmed ranges and preserves seconds", async () => {
    const view = await render({ showTime: true });
    const inputs = timeInputs();
    await inputs[0].setValue("09:08:07");
    await inputs[1].setValue("10:11:12");
    await flushPromises();
    button("确定").click();
    await flushPromises();
    const range = view.emitted("update:modelValue")![0][0] as DateRangeValue;
    expect([
      range[0].getHours(),
      range[0].getMinutes(),
      range[0].getSeconds(),
    ]).toEqual([9, 8, 7]);
    expect(range[1].getHours()).toBe(10);
    expect(range[0]).not.toBe(initial[0]);
  });

  it("does not submit a half range or a reversed same-day time range", async () => {
    const view = await render({ showTime: true });
    await timeInputs()[0].setValue("12:00:00");
    await flushPromises();
    expect(button("确定").disabled).toBe(true);
    expect(document.body.textContent).toContain("结束时间不能早于开始时间");
    view.findComponent(RangeCalendar).vm.$emit("update:modelValue", {
      start: new CalendarDate(2026, 10, 20),
      end: undefined,
    });
    await flushPromises();
    expect(button("确定").disabled).toBe(true);
    expect(view.emitted("update:modelValue")).toBeUndefined();
  });

  it("uses fresh preset functions, validates bounds and normalizes date-only selections", async () => {
    const preset = vi.fn(
      (): DateRangeValue => [
        new Date(2026, 9, 20, 9),
        new Date(2026, 9, 21, 18),
      ],
    );
    const view = await render({
      presets: [{ label: "快捷范围", value: preset }],
      maxDate: new Date(2026, 9, 20),
    });
    expect(preset).not.toHaveBeenCalled();
    button("快捷范围").click();
    await flushPromises();
    expect(preset).toHaveBeenCalledTimes(1);
    expect(button("确定").disabled).toBe(true);
    await view.setProps({ maxDate: new Date(2026, 9, 21) });
    button("确定").click();
    await flushPromises();
    const range = view.emitted("update:modelValue")![0][0] as DateRangeValue;
    expect(range.map((date) => date.getHours())).toEqual([0, 0]);
  });

  it("resyncs external changes, clears atomically, and respects disabled", async () => {
    const view = await render({ showTime: true });
    await view.setProps({
      modelValue: [new Date(2026, 10, 1, 8), new Date(2026, 10, 2, 9)],
    });
    await flushPromises();
    expect(
      (document.querySelector('input[type="time"]') as HTMLInputElement).value,
    ).toMatch(/^08:00(:00)?$/);
    button("清除").click();
    await flushPromises();
    expect(view.emitted("update:modelValue")![0]).toEqual([undefined]);
    await view.setProps({ modelValue: undefined, disabled: true });
    expect(
      view.get("[data-date-range-trigger]").attributes("disabled"),
    ).toBeDefined();
    expect(view.get("[data-date-range-trigger]").text()).toContain(
      "选择日期时间范围",
    );
  });

  it("handles invalid external values and has no implicit past-only limit", async () => {
    const view = await render({ modelValue: [new Date(NaN), initial[1]] });
    expect(view.get("[data-date-range-trigger]").text()).toContain(
      "选择日期范围",
    );
    view.findComponent(RangeCalendar).vm.$emit("update:modelValue", {
      start: new CalendarDate(2030, 1, 1),
      end: new CalendarDate(2030, 1, 2),
    });
    await flushPromises();
    expect(button("确定").disabled).toBe(false);
    button("确定").click();
    await flushPromises();
    expect(
      (
        view.emitted("update:modelValue")![0][0] as DateRangeValue
      )[0].getFullYear(),
    ).toBe(2030);
  });
});
