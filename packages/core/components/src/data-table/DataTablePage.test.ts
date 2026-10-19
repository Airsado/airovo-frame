import { mount } from "@vue/test-utils";
import { h, nextTick } from "vue";
import { createI18n } from "vue-i18n";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import DataTable from "./DataTable.vue";
import DataTablePage from "./DataTablePage.vue";
import DataTablePagination from "./DataTablePagination.vue";
import SectionPage from "../section-page/SectionPage.vue";

const global = {
  plugins: [
    createI18n({
      legacy: false,
      locale: "zh-CN",
      messages: {
        "zh-CN": {
          common: {
            viewMode: "视图模式",
            cardView: "卡片视图",
            tableView: "表格视图",
          },
        },
      },
    }),
  ],
  stubs: {
    FrameworkTooltip: { template: '<span><slot name="trigger" /></span>' },
    Icon: true,
  },
};

function setViewport(matches: boolean): void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      matches,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
}

beforeEach(() => setViewport(false));
afterEach(() => {
  localStorage.clear();
  setViewport(false);
});

describe("DataTablePage view mode", () => {
  it("switches the shared table/card slots and persists an uncontrolled mode", async () => {
    const wrapper = mount(DataTablePage, {
      global,
      props: {
        enableViewModeToggle: true,
        viewModeStorageKey: "view-mode-test",
      },
      slots: {
        toolbar: "<span data-toolbar>toolbar</span>",
        table: "<div data-table>table</div>",
        mobile: "<div data-card>card</div>",
      },
    });

    // new-api defaults an opted-in page to cards; a stored choice can still
    // switch it back to the table on subsequent renders.
    expect(wrapper.find("[data-table]").exists()).toBe(false);
    expect(wrapper.find("[data-card]").exists()).toBe(true);
    await wrapper.get('button[aria-label="表格视图"]').trigger("click");
    await nextTick();
    expect(wrapper.find("[data-table]").exists()).toBe(true);
    expect(wrapper.find("[data-card]").exists()).toBe(false);
    await wrapper.get('button[aria-label="卡片视图"]').trigger("click");
    await nextTick();
    expect(wrapper.find("[data-table]").exists()).toBe(false);
    expect(wrapper.find("[data-card]").exists()).toBe(true);
    expect(localStorage.getItem("view-mode-test")).toBe("card");
    expect(wrapper.emitted("update:viewMode")?.at(-1)).toEqual(["card"]);

    const restored = mount(DataTablePage, {
      global,
      props: {
        enableViewModeToggle: true,
        viewModeStorageKey: "view-mode-test",
      },
      slots: {
        table: "<div data-table>table</div>",
        mobile: "<div data-card>card</div>",
      },
    });
    await nextTick();
    expect(restored.find("[data-table]").exists()).toBe(false);
    expect(restored.find("[data-card]").exists()).toBe(true);
  });

  it("supports a controlled mode without changing the parent value implicitly", async () => {
    const wrapper = mount(DataTablePage, {
      global,
      props: { enableViewModeToggle: true, viewMode: "card" },
      slots: {
        table: "<div data-table>table</div>",
        mobile: "<div data-card>card</div>",
      },
    });

    expect(wrapper.find("[data-card]").exists()).toBe(true);
    await wrapper.get('button[aria-label="表格视图"]').trigger("click");
    expect(wrapper.emitted("update:viewMode")?.at(-1)).toEqual(["table"]);
    expect(wrapper.find("[data-card]").exists()).toBe(true);
  });

  it("automatically renders DataTableCardGrid when card rows and columns are provided", async () => {
    const wrapper = mount(DataTablePage, {
      global,
      props: {
        enableViewModeToggle: true,
        viewMode: "card",
        cardRows: [{ id: 1, name: "one", status: "ready" }],
        cardColumns: [
          { key: "name", title: "名称", mobileTitle: true },
          { key: "status", title: "状态", mobileBadge: true },
        ],
        cardRowKey: "id",
        cardSelectable: true,
      },
      slots: {
        table: "<div data-table>table</div>",
        "card-cell-status": "<strong data-status>{{ value }}</strong>",
        "card-actions": "<span data-actions>actions</span>",
      },
    });

    expect(wrapper.find('[data-slot="data-table-card"]').exists()).toBe(true);
    expect(wrapper.get("[data-status]").text()).toBe("ready");
    expect(wrapper.get("[data-actions]").text()).toBe("actions");
    await wrapper.get('[data-slot="checkbox"]').trigger("click");
    expect(wrapper.emitted("update:cardSelectedKeys")?.at(-1)).toEqual([[1]]);
  });

  it("uses the automatic mobile list fallback for mobileCards without a mobile slot", () => {
    setViewport(true);
    const wrapper = mount(DataTablePage, {
      global,
      props: {
        mobileCards: true,
        cardRows: [{ id: 1, name: "one" }],
        cardColumns: [{ key: "name", title: "名称" }],
      },
      slots: { table: "<div data-table>table</div>" },
    });

    expect(
      wrapper.find('[data-slot="data-table-mobile-card-list"]').exists(),
    ).toBe(true);
    expect(wrapper.find('[data-slot="data-table-mobile-row"]').exists()).toBe(
      true,
    );
    expect(wrapper.find("[data-table]").exists()).toBe(false);
  });

  it("shares rows, selection and request state between the built-in table and cards", async () => {
    const wrapper = mount(DataTablePage, {
      global,
      props: {
        rows: [{ id: 1, name: "one" }],
        columns: [{ key: "name", title: "名称", mobileTitle: true }],
        rowKey: "id",
        selectable: true,
        mobileCards: true,
        enableViewModeToggle: true,
        viewMode: "card",
        pagination: true,
        page: 1,
        pageSize: 1,
        total: 2,
      },
    });

    expect(wrapper.get('[aria-label="下一页"]').exists()).toBe(true);
    await wrapper.get('[aria-label="下一页"]').trigger("click");
    expect(wrapper.emitted("update:page")?.at(-1)).toEqual([2]);
    await wrapper.get('[data-slot="checkbox"]').trigger("click");
    expect(wrapper.emitted("update:selectedKeys")?.at(-1)).toEqual([[1]]);

    await wrapper.setProps({ viewMode: "table" });
    await nextTick();
    expect(wrapper.find("table").exists()).toBe(true);
    expect(
      wrapper.find('tbody [data-slot="checkbox"]').attributes("aria-checked"),
    ).toBe("true");
  });

  it("forwards selection listeners to custom table slots", () => {
    let slotProps: Record<string, unknown> | undefined;
    mount(DataTablePage, {
      global,
      props: {
        rows: [{ id: 1, name: "one" }],
        columns: [{ key: "name", title: "名称" }],
        selectable: true,
      },
      slots: {
        table: (props) => {
          slotProps = props as Record<string, unknown>;
          return h("div", { "data-table-slot": true });
        },
      },
    });

    expect(slotProps?.["onUpdate:selectedKeys"]).toEqual(expect.any(Function));
    expect(slotProps?.onSelectionChange).toEqual(expect.any(Function));
  });

  it("forwards inner pagination navigation through a bound custom table slot", async () => {
    const wrapper = mount(DataTablePage, {
      global,
      props: {
        rows: [{ id: 1, name: "one" }],
        columns: [{ key: "name", title: "名称" }],
        pagination: true,
        paginationInFooter: false,
        page: 2,
        pageSize: 10,
        total: 90,
      },
      // Match a consumer's `<DataTable v-bind="tableProps" />` without
      // manually calling the slot's updatePage helper.
      slots: { table: (tableProps) => h(DataTable, tableProps) },
    });

    const table = wrapper.getComponent(DataTable);
    expect(table.props("pagination")).toBe(true);
    await wrapper.get('[aria-label="下一页"]').trigger("click");
    expect(wrapper.emitted("update:page")?.at(-1)).toEqual([3]);

    // The parent owns controlled state; emission must not change it early.
    expect(table.props("page")).toBe(2);
    await wrapper.setProps({ page: 3 });
    expect(table.props("page")).toBe(3);
    expect(wrapper.getComponent(DataTablePagination).props("page")).toBe(3);
  });

  it("forwards inner page-size changes through a bound custom table slot", async () => {
    const wrapper = mount(DataTablePage, {
      global,
      props: {
        rows: [{ id: 1, name: "one" }],
        columns: [{ key: "name", title: "名称" }],
        pagination: true,
        paginationInFooter: false,
        page: 2,
        pageSize: 10,
        total: 90,
      },
      slots: { table: (tableProps) => h(DataTable, tableProps) },
    });

    const table = wrapper.getComponent(DataTable);
    const pagination = wrapper.getComponent(DataTablePagination);
    // Exercise the real pagination -> DataTable -> slot binding event path.
    // Popup selection and host focus are covered by overlay-pagination.test.
    pagination.vm.$emit("update:pageSize", 20);
    await nextTick();
    expect(wrapper.emitted("update:pageSize")?.at(-1)).toEqual([20]);

    expect(table.props("pageSize")).toBe(10);
    await wrapper.setProps({ pageSize: 20 });
    expect(table.props("pageSize")).toBe(20);
    expect(pagination.props("pageSize")).toBe(20);
  });

  it("places pagination in the surrounding SectionPage footer when available", async () => {
    const wrapper = mount(SectionPage, {
      global,
      slots: {
        default: () =>
          h(DataTablePage, {
            rows: [{ id: 1, name: "one" }],
            columns: [{ key: "name", title: "名称" }],
            pagination: true,
            pageSize: 1,
            total: 2,
          }),
      },
    });

    await nextTick();
    const footer = wrapper.get('[data-slot="section-page-footer-host"]');
    expect(footer.get('[aria-label="下一页"]').exists()).toBe(true);
    expect(
      wrapper
        .find('[data-slot="data-table-surface"] [aria-label="下一页"]')
        .exists(),
    ).toBe(false);
  });

  it("keeps shared error and retry state available in card view", async () => {
    const wrapper = mount(DataTablePage, {
      global,
      props: {
        rows: [{ id: 1, name: "one" }],
        columns: [{ key: "name", title: "名称", mobileTitle: true }],
        mobileCards: true,
        viewMode: "card",
        error: new Error("failed"),
      },
    });

    expect(wrapper.get('[role="alert"]').text()).toContain("加载失败");
    await wrapper.get('[role="alert"] button').trigger("click");
    expect(wrapper.emitted("retry")).toHaveLength(1);
  });

  it("preserves legacy card row-key indexes when rendering the automatic table", () => {
    const wrapper = mount(DataTablePage, {
      global,
      props: {
        rows: [{ name: "one" }, { name: "two" }],
        columns: [{ key: "name", title: "名称" }],
        cardRowKey: (_row: Record<string, unknown>, index: number) =>
          `row-${index}`,
        selectable: true,
      },
    });

    expect(wrapper.findAll("tbody tr")).toHaveLength(2);
    expect(wrapper.findAll('tbody [data-slot="checkbox"]')).toHaveLength(2);
  });

  it("renders the optional toolbar-bottom slot without changing toolbar behavior", () => {
    const wrapper = mount(DataTablePage, {
      global,
      slots: {
        toolbar: "<div data-toolbar>toolbar</div>",
        "toolbar-bottom": "<div data-toolbar-bottom>query form</div>",
        table: "<div data-table>table</div>",
      },
    });

    expect(wrapper.find("[data-toolbar]").exists()).toBe(true);
    expect(wrapper.find("[data-toolbar-bottom]").exists()).toBe(true);
  });
});
