// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { createI18n } from "vue-i18n";
import { describe, expect, it } from "vitest";
import DataTablePagination from "./DataTablePagination.vue";
import DataTable from "./DataTable.vue";

const global = {
  plugins: [
    createI18n({
      legacy: false,
      locale: "zh-CN",
      messages: {
        "zh-CN": {
          common: {
            total: "共",
            rowsPerPage: "每页",
            firstPage: "首页",
            previousPage: "上一页",
            nextPage: "下一页",
            lastPage: "末页",
          },
        },
      },
    }),
  ],
};

const SelectStub = defineComponent({
  props: { modelValue: { type: String, default: undefined } },
  emits: ["update:modelValue"],
  template: '<div data-slot="select"><slot /></div>',
});

const selectStubs = {
  Select: SelectStub,
  SelectTrigger: {
    template: '<button data-slot="select-trigger"><slot /></button>',
  },
  SelectValue: {
    props: ["placeholder"],
    template: '<span data-slot="select-value">{{ placeholder }}</span>',
  },
  SelectContent: { template: '<div data-slot="select-content"><slot /></div>' },
  SelectGroup: { template: '<div data-slot="select-group"><slot /></div>' },
  SelectItem: {
    props: ["value"],
    template:
      '<button data-slot="select-item" :data-value="value"><slot /></button>',
  },
};

describe("DataTablePagination", () => {
  it("clamps page navigation and emits page-size changes", async () => {
    const wrapper = mount(DataTablePagination, {
      props: { page: 2, pageSize: 10, total: 21 },
      global: { ...global, stubs: selectStubs },
    });

    expect(wrapper.text()).toContain("共21");
    expect(wrapper.get('[aria-label="首页"]').exists()).toBe(true);
    expect(
      wrapper.get('button[aria-label="前往第 2 页"]').attributes("data-variant"),
    ).toBe("default");
    await wrapper.get('[aria-label="下一页"]').trigger("click");
    expect(wrapper.emitted("update:page")?.at(-1)).toEqual([3]);

    expect(
      wrapper.get('[data-slot="select-item"][data-value="30"]').exists(),
    ).toBe(true);
    wrapper.findComponent(SelectStub).vm.$emit("update:modelValue", "20");
    expect(wrapper.emitted("update:pageSize")?.at(-1)).toEqual([20]);
  });

  it("supports the compact mobile layout while retaining clamped navigation", async () => {
    const wrapper = mount(DataTablePagination, {
      props: { compact: true, page: 1, pageSize: 10, total: 21 },
      global,
    });
    expect(wrapper.get('nav[aria-label="pagination"]').text()).toContain(
      "共 21",
    );
    await wrapper.get('[aria-label="下一页"]').trigger("click");
    expect(wrapper.emitted("update:page")?.at(-1)).toEqual([2]);
  });

  it("keeps the new-api four-page window and locale-formats totals", async () => {
    const wrapper = mount(DataTablePagination, {
      props: { page: 1, pageSize: 10, total: 1000 },
      global: { ...global, stubs: selectStubs },
    });

    expect(wrapper.text()).toContain((1000).toLocaleString());
    expect(wrapper.get('button[aria-label="前往第 2 页"]').exists()).toBe(true);
    expect(wrapper.get('button[aria-label="前往第 100 页"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('button[aria-label="前往第 3 页"]').exists()).toBe(
      false,
    );
    expect(wrapper.findAll('[data-slot="pagination-ellipsis"]')).toHaveLength(
      1,
    );

    await wrapper.setProps({ page: 50 });
    expect(wrapper.get('button[aria-label="前往第 50 页"]').exists()).toBe(
      true,
    );
    expect(wrapper.findAll('[data-slot="pagination-ellipsis"]')).toHaveLength(
      2,
    );
  });

  it("supports a bounded table viewport without losing horizontal scrolling", () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [{ key: "name", title: "名称" }],
        data: [{ id: 1, name: "one" }],
        maxHeight: 320,
      },
      global: {
        plugins: [
          createI18n({
            legacy: false,
            locale: "zh-CN",
            messages: { "zh-CN": { common: { noData: "暂无数据" } } },
          }),
        ],
      },
    });

    expect(wrapper.attributes("style")).toContain("max-height: 320px");
    expect(wrapper.classes()).toContain("overflow-hidden");

    const surface = wrapper.get('[data-slot="data-table-surface"]');
    expect(surface.classes()).toContain("overflow-hidden");
    expect(surface.get('[data-slot="table-container"]').classes()).toEqual(
      expect.arrayContaining(["min-h-0", "flex-1", "overflow-auto"]),
    );
  });
});
