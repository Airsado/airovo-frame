// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import DataTable from "./DataTable.vue";

const columns = [
  { key: "name", title: "名称", sortable: true },
  { key: "kind", title: "类型", hidden: true },
];

const rows = [
  { id: 1, name: "one", kind: "a" },
  { id: 2, name: "two", kind: "b" },
];

function mountTable(
  props: Record<string, unknown> = {},
  slots: Record<string, unknown> = {},
) {
  return mount(DataTable, {
    props: { columns, data: rows, ...props },
    slots,
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
}

describe("DataTable", () => {
  it("matches the new-api bordered table surface and keeps the toolbar outside it", () => {
    const wrapper = mountTable(
      { pagination: true, total: rows.length },
      {
        toolbar: "<span data-toolbar>表格工具栏</span>",
      },
    );
    const surface = wrapper.get('[data-slot="data-table-surface"]');

    expect(surface.classes()).toEqual(
      expect.arrayContaining(["overflow-hidden", "rounded-lg", "border"]),
    );
    expect(surface.find("table").exists()).toBe(true);
    expect(surface.find('[data-slot="table-container"]').classes()).toEqual(
      expect.arrayContaining(["min-h-0", "flex-1", "overflow-auto"]),
    );
    expect(surface.find('[data-slot="pagination"]').exists()).toBe(false);
    expect(wrapper.find('[data-slot="pagination"]').exists()).toBe(true);
    expect(surface.find("[data-toolbar]").exists()).toBe(false);
    expect(wrapper.find("[data-toolbar]").exists()).toBe(true);
  });

  it("uses the new-api muted row surface for hover and selected states", () => {
    const wrapper = mountTable({ selectable: true, selectedKeys: [1] });
    const row = wrapper.get("tbody tr");
    expect(row.classes()).toEqual(
      expect.arrayContaining([
        "data-[state=selected]:bg-muted",
        "hover:[background-color:color-mix(in_oklch,var(--muted)_50%,var(--background))]",
      ]),
    );
    expect(row.attributes("data-state")).toBe("selected");
  });

  it("uses the new-api compact header and cell density", () => {
    const wrapper = mountTable({ selectable: true }, { actions: "操作" });
    expect(wrapper.get("thead").classes()).toEqual(
      expect.arrayContaining(["sticky", "top-0", "z-20"]),
    );
    expect(wrapper.get('thead th[data-column-id="name"]').classes()).toContain(
      "data-table-pinned-header",
    );
    expect(
      wrapper.get('thead th[data-column-id="selection"]').classes(),
    ).toContain("px-2");
    expect(wrapper.get('thead th[data-column-id="name"]').classes()).toContain(
      "px-2",
    );
    expect(
      wrapper.get('tbody td[data-column-id="selection"]').classes(),
    ).toContain("p-2");
    expect(wrapper.get('tbody td[data-column-id="name"]').classes()).toContain(
      "p-2",
    );
    expect(
      wrapper.get('tbody td[data-column-id="actions"]').classes(),
    ).toContain("p-2");
    // Match new-api: the Checkbox itself owns pointer and keyboard interaction.
    // Selection cells must not disable the control and proxy clicks from a
    // parent cell, otherwise the control cannot receive focus.
    expect(wrapper.get('thead [data-slot="checkbox"]').classes()).not.toContain(
      "pointer-events-none",
    );
    expect(wrapper.get('tbody [data-slot="checkbox"]').classes()).not.toContain(
      "pointer-events-none",
    );
  });

  it("supports controlled row selection and current-page select-all state", async () => {
    const wrapper = mountTable(
      { selectable: true },
      {
        "cell-name": ({ value }: { value: unknown }) => `slot:${String(value)}`,
      },
    );

    expect(wrapper.text()).toContain("slot:one");
    expect(wrapper.text()).not.toContain("a");

    const checkboxes = wrapper.findAll('[data-slot="checkbox"]');
    await checkboxes[1].trigger("click");
    expect(wrapper.emitted("selection-change")?.at(-1)).toEqual([[1]]);
    expect(checkboxes[0].attributes("aria-checked")).toBe("mixed");

    await checkboxes[0].trigger("click");
    expect(wrapper.emitted("update:selectedKeys")?.at(-1)).toEqual([[1, 2]]);
    expect(checkboxes[0].attributes("aria-checked")).toBe("true");
  });

  it("keeps selection controls keyboard reachable like new-api", async () => {
    const wrapper = mountTable({ selectable: true });
    const rowCheckbox = wrapper.find('tbody [data-slot="checkbox"]');

    await rowCheckbox.trigger("keydown", { key: " " });
    await rowCheckbox.trigger("keyup", { key: " " });
    // happy-dom does not synthesize the native button activation click.
    await rowCheckbox.trigger("click", { detail: 0 });
    expect(wrapper.emitted("selection-change")?.at(-1)).toEqual([[1]]);
    expect(wrapper.emitted("selection-change")).toHaveLength(1);
  });

  it("clears stale controlled keys when the page-scoped rows change", async () => {
    const wrapper = mountTable({
      selectable: true,
      selectedKeys: [1],
      page: 1,
    });

    await wrapper.setProps({
      data: [{ id: 3, name: "three", kind: "c" }],
      page: 2,
    });
    expect(wrapper.emitted("update:selectedKeys")?.at(-1)).toEqual([[]]);
  });

  it("renders toolbar and row actions only when their slots are provided", () => {
    const wrapper = mountTable(
      {},
      {
        toolbar: "表格工具栏",
        actions: ({
          row,
          rowKey,
        }: {
          row: Record<string, unknown>;
          rowKey: string | number;
        }) => `编辑 ${String(row.id)} (${String(rowKey)})`,
      },
    );

    expect(wrapper.text()).toContain("表格工具栏");
    expect(wrapper.text()).toContain("编辑 1 (1)");
    expect(wrapper.findAll("thead th")).toHaveLength(2);
    expect(wrapper.findAll("tbody td")).toHaveLength(4);

    const withoutActions = mountTable();
    expect(withoutActions.findAll("thead th")).toHaveLength(1);
  });

  it("renders an explicitly declared action cell once without enabling automatic actions", () => {
    const wrapper = mountTable(
      {
        columns: [
          { key: "name", title: "名称" },
          { key: "actions", title: "操作", hideable: false },
        ],
      },
      { "cell-actions": ({ row }: { row: { id: number } }) => `添加 ${row.id}` },
    );

    expect(wrapper.findAll('thead [data-column-id="actions"]')).toHaveLength(1);
    expect(wrapper.findAll('tbody [data-column-id="actions"]')).toHaveLength(rows.length);
    expect(wrapper.get('tbody [data-column-id="actions"]').text()).toBe("添加 1");
    expect(wrapper.findAll("thead th")).toHaveLength(2);
  });

  it("renders the new-api empty surface with configurable content and actions", () => {
    const wrapper = mountTable(
      {
        data: [],
        emptyTitle: "没有渠道",
        emptyDescription: "调整筛选条件后重试",
        emptyIcon: "lucide:inbox",
      },
      {
        "empty-action": '<button type="button">清除筛选</button>',
      },
    );

    expect(wrapper.get('[data-slot="empty"]').classes()).toEqual(
      expect.arrayContaining(["border-0", "gap-4", "rounded-xl"]),
    );
    expect(wrapper.get('[data-slot="empty-icon"]').classes()).toContain(
      "size-8",
    );
    expect(wrapper.get('[data-slot="empty-title"]').classes()).toContain(
      "text-sm",
    );
    expect(wrapper.get('[data-slot="empty-title"]').text()).toBe("没有渠道");
    expect(wrapper.get('[data-slot="empty-description"]').text()).toBe(
      "调整筛选条件后重试",
    );
    const cell = wrapper.get("tbody td");
    expect(cell.classes()).toContain("h-[400px]");
    expect(cell.attributes("role")).toBeUndefined();
    expect(cell.attributes("aria-live")).toBeUndefined();
    expect(cell.get('[data-slot="empty"]').attributes("role")).toBe("status");
    expect(cell.get('[data-slot="empty"]').attributes("aria-live")).toBe(
      "polite",
    );
    expect(wrapper.text()).toContain("清除筛选");
  });

  it("exposes a single accessible state surface for loading, error and empty data", () => {
    const loading = mountTable({ loading: true });
    expect(
      loading.get('[data-slot="data-table-surface"]').attributes("aria-busy"),
    ).toBe("true");
    expect(loading.get('[role="status"]').text()).toContain("加载中");

    const error = mountTable({ error: new Error("failed") });
    expect(error.get('[role="alert"]').text()).toContain("加载失败");
    expect(error.get("tbody td").attributes("role")).toBeUndefined();
    expect(error.get('[role="alert"]').attributes("aria-live")).toBe(
      "assertive",
    );

    const empty = mountTable({ data: [] });
    expect(empty.get('[role="status"]').text()).toContain("暂无");
    expect(empty.get("tbody td").attributes("role")).toBeUndefined();
    expect(empty.get('[role="status"]').attributes("aria-live")).toBe("polite");
  });

  it("keeps legacy emptyText and custom empty slots compatible", () => {
    const legacy = mountTable({ data: [], emptyText: "自定义暂无数据" });
    expect(legacy.get('[data-slot="empty-title"]').text()).toBe(
      "自定义暂无数据",
    );

    const custom = mountTable(
      { data: [] },
      { empty: "<span data-custom-empty>自定义空内容</span>" },
    );
    expect(custom.get("[data-custom-empty]").text()).toBe("自定义空内容");
    expect(custom.find('[data-slot="empty"]').exists()).toBe(false);
  });

  it("uses the configured stable row key for selection and DOM identity", async () => {
    const wrapper = mountTable({
      selectable: true,
      rowKey: (row: Record<string, unknown>) => String(row.uuid),
      data: [
        { uuid: "a", name: "A" },
        { uuid: "b", name: "B" },
      ],
    });

    await wrapper.find('tbody [data-slot="checkbox"]').trigger("click");
    expect(wrapper.emitted("selection-change")?.at(-1)).toEqual([["a"]]);

    await wrapper.setProps({
      data: [
        { uuid: "b", name: "B" },
        { uuid: "a", name: "A" },
      ],
    });
    const rowCheckboxes = wrapper.findAll('tbody [data-slot="checkbox"]');
    expect(rowCheckboxes[0]?.attributes("aria-checked")).toBe("false");
    expect(rowCheckboxes[1]?.attributes("aria-checked")).toBe("true");
  });

  it("fails fast when a row does not expose a stable key", () => {
    expect(() => mountTable({ data: [{ name: "missing id" }] })).toThrow(
      /stable row key/i,
    );
    expect(() =>
      mountTable({
        data: [
          { id: 1, name: "one" },
          { id: 1, name: "duplicate" },
        ],
      }),
    ).toThrow(/unique/i);
  });

  it("supports formatter, manual sort, pagination and retry actions", async () => {
    const wrapper = mountTable({
      columns: [
        {
          key: "name",
          title: "名称",
          sortable: true,
          formatter: (value: unknown) => `格式化:${String(value)}`,
        },
      ],
      data: [
        { id: 2, name: "two" },
        { id: 1, name: "one" },
      ],
      manualSort: true,
      pagination: true,
      page: 1,
      pageSize: 1,
      total: 2,
    });

    expect(wrapper.text()).toContain("格式化:two");
    await wrapper
      .get('[data-slot="data-table-column-header-trigger"]')
      .trigger("click");
    await nextTick();
    const ascItem = document.body.querySelector(
      '[data-slot="data-table-column-header-sort-asc"]',
    ) as HTMLElement;
    expect(ascItem).not.toBeNull();
    ascItem.click();
    await nextTick();
    expect(wrapper.emitted("sort-change")?.at(-1)).toEqual([
      { key: "name", direction: "asc" },
    ]);
    expect(wrapper.find("tbody tr").text()).toContain("格式化:two");

    const nextPage = wrapper.get('[aria-label="下一页"]');
    await nextPage.trigger("click");
    expect(wrapper.emitted("update:page")?.at(-1)).toEqual([2]);

    const errorWrapper = mountTable({ error: new Error("failed") });
    await errorWrapper.find("tbody button").trigger("click");
    expect(errorWrapper.emitted("retry")).toHaveLength(1);
  });

  it("matches the new-api column header menu and exposes explicit sort actions", async () => {
    const wrapper = mountTable();
    const trigger = wrapper.get(
      '[data-slot="data-table-column-header-trigger"]',
    );
    expect(trigger.classes()).toEqual(
      expect.arrayContaining(["h-8", "data-popup-open:bg-accent"]),
    );
    expect(trigger.attributes("aria-label")).toBe("名称");

    await trigger.trigger("click");
    await nextTick();
    expect(
      document.body.querySelector(
        '[data-slot="data-table-column-header-menu"]',
      ),
    ).not.toBeNull();
    const descItem = document.body.querySelector(
      '[data-slot="data-table-column-header-sort-desc"]',
    ) as HTMLElement;
    descItem.click();
    await nextTick();
    expect(wrapper.emitted("sort-change")?.at(-1)).toEqual([
      { key: "name", direction: "desc" },
    ]);
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape" }),
    );
    wrapper.unmount();
  });

  it("hides columns through the header menu while respecting hideable=false", async () => {
    const wrapper = mountTable({
      columns: [
        { key: "name", title: "名称", sortable: true },
        { key: "kind", title: "类型", sortable: true, hideable: false },
      ],
    });
    await wrapper
      .get('[data-slot="data-table-column-header-trigger"]')
      .trigger("click");
    await nextTick();
    expect(
      document.body.querySelector(
        '[data-slot="data-table-column-header-hide"]',
      ),
    ).not.toBeNull();
    const hideItem = document.body.querySelector(
      '[data-slot="data-table-column-header-hide"]',
    ) as HTMLElement;
    hideItem.click();
    await nextTick();
    expect(wrapper.emitted("update:columnVisibility")?.at(-1)).toEqual([
      { name: false, kind: true },
    ]);
    expect(wrapper.find('th[data-column-id="name"]').exists()).toBe(false);

    const remainingTrigger = wrapper.get(
      '[data-slot="data-table-column-header-trigger"]',
    );
    await remainingTrigger.trigger("click");
    await nextTick();
    expect(
      document.body.querySelector(
        '[data-slot="data-table-column-header-hide"]',
      ),
    ).toBeNull();
    wrapper.unmount();
  });

  it("supports controlled column visibility for view-option integrations", async () => {
    const wrapper = mountTable({ columnVisibility: { name: false } });
    expect(wrapper.findAll("thead th")).toHaveLength(0);

    await wrapper.setProps({ columnVisibility: { name: true } });
    expect(wrapper.findAll("thead th")).toHaveLength(1);
  });

  it("supports bounded column sizing through the resize handle", async () => {
    const wrapper = mountTable({
      columns: [
        {
          key: "name",
          title: "名称",
          resizable: true,
          minSize: 100,
          maxSize: 220,
        },
      ],
    });
    const handle = wrapper.find("th span.cursor-col-resize");
    expect(handle.exists()).toBe(true);
    await handle.trigger("pointerdown", { clientX: 100 });
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 350 }));
    expect(wrapper.emitted("update:columnSizing")?.at(-1)?.[0]).toEqual({
      name: 220,
    });
    window.dispatchEvent(new PointerEvent("pointerup", { clientX: 350 }));
  });

  it("enables resizing for all columns through the opt-in table switch", () => {
    const wrapper = mountTable({
      enableColumnResizing: true,
      columns: [
        { key: "name", title: "名称", minSize: 100 },
        { key: "kind", title: "类型", resizable: false },
      ],
    });

    expect(wrapper.findAll("[data-column-resizer]")).toHaveLength(1);
    expect(wrapper.find("[data-column-resizer]").attributes("aria-label")).toBe(
      "调整列宽：名称",
    );
  });

  it("uses a colgroup and minimum table width while resizing is enabled", () => {
    const wrapper = mountTable(
      {
        enableColumnResizing: true,
        columns: [
          { key: "name", title: "名称", width: "180px" },
          { key: "kind", title: "类型", minSize: 220 },
        ],
      },
      { actions: "操作" },
    );

    expect(wrapper.findAll("table > colgroup > col")).toHaveLength(3);
    expect(wrapper.find("table").attributes("style")).toContain(
      "min-width: max(100%, 500px)",
    );
    expect(
      wrapper
        .find('table > colgroup > col[data-column-id="name"]')
        .attributes("style"),
    ).toContain("width: 180px");
  });

  it("applies explicit sizing consistently over the original CSS width constraints", async () => {
    const wrapper = mountTable({
      enableColumnResizing: true,
      columns: [
        {
          key: "name",
          title: "名称",
          minWidth: "15rem",
          minSize: 180,
          maxSize: 420,
        },
      ],
      columnSizing: { name: 340 },
    });
    const sizedElements = () => wrapper.findAll('[data-column-id="name"]');
    expect(sizedElements()).toHaveLength(4);
    for (const element of sizedElements()) {
      const style = (element.element as HTMLElement).style;
      expect(style.width).toBe("340px");
      expect(style.minWidth).toBe("340px");
      expect(style.maxWidth).toBe("340px");
    }

    await wrapper.setProps({ columnSizing: { name: 180 } });
    for (const element of sizedElements()) {
      const style = (element.element as HTMLElement).style;
      expect(style.width).toBe("180px");
      expect(style.minWidth).toBe("180px");
      expect(style.maxWidth).toBe("180px");
    }
    expect(wrapper.get("table").element.style.tableLayout).toBe("auto");
  });

  it("exposes a keyboard resize separator with bounded and auto-size controls", async () => {
    const wrapper = mountTable({
      columns: [
        {
          key: "name",
          title: "名称",
          width: "120px",
          resizable: true,
          minSize: 100,
          maxSize: 220,
        },
      ],
    });
    const handle = wrapper.find("[data-column-resizer]");
    expect(handle.attributes("role")).toBe("separator");
    expect(handle.attributes("aria-orientation")).toBe("vertical");
    expect(handle.attributes("aria-label")).toBe("调整列宽：名称");
    expect(handle.attributes("tabindex")).toBe("0");

    await handle.trigger("keydown", { key: "ArrowRight" });
    expect(wrapper.emitted("update:columnSizing")?.at(-1)?.[0]).toEqual({
      name: 130,
    });
    await handle.trigger("keydown", { key: "ArrowLeft", shiftKey: true });
    expect(wrapper.emitted("update:columnSizing")?.at(-1)?.[0]).toEqual({
      name: 100,
    });

    const originalScrollWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollWidth",
    );
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get: () => 180,
    });
    await handle.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("update:columnSizing")?.at(-1)?.[0]).toEqual({
      name: 180,
    });
    Object.defineProperty(
      HTMLElement.prototype,
      "scrollWidth",
      originalScrollWidth ?? { configurable: true, value: 0 },
    );
    vi.restoreAllMocks();
  });

  it("starts a CSS-unit column resize at its rendered header width", async () => {
    const wrapper = mountTable({
      enableColumnResizing: true,
      columns: [
        {
          key: "name",
          title: "名称",
          width: "11rem",
          minSize: 140,
          maxSize: 280,
        },
      ],
    });
    const header = wrapper.get('thead th[data-column-id="name"]');
    const measurement = vi.spyOn(header.element, "getBoundingClientRect");
    measurement.mockReturnValue({ width: 196 } as DOMRect);
    const handle = wrapper.get("[data-column-resizer]");

    await handle.trigger("pointerdown", { clientX: 100 });
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 120 }));
    window.dispatchEvent(new PointerEvent("pointerup", { clientX: 120 }));
    await nextTick();
    expect(wrapper.emitted("update:columnSizing")?.at(-1)?.[0]).toEqual({
      name: 216,
    });

    measurement.mockReturnValue({ width: 216 } as DOMRect);
    await handle.trigger("keydown", { key: "ArrowRight" });
    expect(wrapper.emitted("update:columnSizing")?.at(-1)?.[0]).toEqual({
      name: 226,
    });
    measurement.mockRestore();
  });

  it("migrates persisted sizing to the current schema and bounds", async () => {
    localStorage.setItem(
      "data-table-sizing-migration",
      '{"name":400,"removed":180}',
    );
    const wrapper = mountTable({
      columns: [
        {
          key: "name",
          title: "名称",
          resizable: true,
          minSize: 100,
          maxSize: 220,
        },
      ],
      columnSizingStorageKey: "data-table-sizing-migration",
    });
    await nextTick();
    expect(
      wrapper.find('thead th[data-column-id="name"]').attributes("style"),
    ).toContain("width: 220px");
    expect(
      JSON.parse(localStorage.getItem("data-table-sizing-migration") ?? "{}"),
    ).toEqual({ name: 220 });
    localStorage.removeItem("data-table-sizing-migration");
  });

  it("debounces sizing persistence and flushes pending writes on key changes and unmount", async () => {
    vi.useFakeTimers();
    const firstKey = "data-table-sizing-debounce-a";
    const secondKey = "data-table-sizing-debounce-b";
    localStorage.removeItem(firstKey);
    localStorage.removeItem(secondKey);

    try {
      const wrapper = mountTable({
        columns: [
          { key: "name", title: "名称", resizable: true, width: "120px" },
        ],
        columnSizingStorageKey: firstKey,
      });
      const handle = wrapper.find("[data-column-resizer]");
      await handle.trigger("pointerdown", { clientX: 100 });
      window.dispatchEvent(new PointerEvent("pointermove", { clientX: 140 }));

      expect(localStorage.getItem(firstKey)).toBeNull();
      vi.advanceTimersByTime(249);
      expect(localStorage.getItem(firstKey)).toBeNull();
      vi.advanceTimersByTime(1);
      expect(JSON.parse(localStorage.getItem(firstKey) ?? "{}")).toEqual({
        name: 160,
      });

      window.dispatchEvent(new PointerEvent("pointermove", { clientX: 180 }));
      await wrapper.setProps({ columnSizingStorageKey: secondKey });
      await nextTick();
      expect(JSON.parse(localStorage.getItem(firstKey) ?? "{}")).toEqual({
        name: 200,
      });
      expect(localStorage.getItem(secondKey)).toBeNull();

      window.dispatchEvent(new PointerEvent("pointermove", { clientX: 210 }));
      wrapper.unmount();
      expect(JSON.parse(localStorage.getItem(secondKey) ?? "{}")).toEqual({
        name: 230,
      });
    } finally {
      localStorage.removeItem(firstKey);
      localStorage.removeItem(secondKey);
      vi.useRealTimers();
    }
  });

  it("migrates persisted pinning to current columns and sides", async () => {
    localStorage.setItem(
      "data-table-pinning-migration",
      '{"name":"left","removed":"right","bad":"middle"}',
    );
    const wrapper = mountTable({
      columns: [{ key: "name", title: "名称", width: "180px" }],
      columnPinningStorageKey: "data-table-pinning-migration",
    });
    await nextTick();
    expect(
      wrapper.find('thead th[data-column-id="name"]').attributes("style"),
    ).toContain("left: 0px");
    expect(
      JSON.parse(localStorage.getItem("data-table-pinning-migration") ?? "{}"),
    ).toEqual({ name: "left" });
    localStorage.removeItem("data-table-pinning-migration");
  });

  it("pins visible headers and cells with cumulative left/right offsets", async () => {
    const wrapper = mountTable(
      {
        columns: [
          { key: "name", title: "名称", width: "180px" },
          { key: "kind", title: "类型", width: "120px" },
          { key: "status", title: "状态", width: "100px" },
        ],
        selectable: true,
        columnPinning: {
          selection: "left",
          name: "left",
          kind: "left",
          actions: "right",
        },
      },
      { actions: "操作" },
    );

    expect(
      wrapper.find('thead th[data-column-id="selection"]').attributes("style"),
    ).toContain("left: 0px");
    expect(
      wrapper.find('thead th[data-column-id="name"]').attributes("style"),
    ).toContain("left: 40px");
    expect(
      wrapper.find('thead th[data-column-id="actions"]').attributes("style"),
    ).toContain("right: 0px");
    expect(
      wrapper.find('tbody td[data-column-id="name"]').attributes("style"),
    ).toContain("left: 40px");

    await wrapper.setProps({ columnVisibility: { name: false } });
    expect(wrapper.find('thead th[data-column-id="kind"]').exists()).toBe(true);
    expect(
      wrapper.find('thead th[data-column-id="kind"]').attributes("style"),
    ).toContain("left: 40px");
    expect(wrapper.find('thead th[data-column-id="name"]').exists()).toBe(
      false,
    );
  });

  it("restores uncontrolled pinning state from localStorage", async () => {
    localStorage.setItem(
      "data-table-pinning-test",
      '{"name":"left","actions":"right"}',
    );
    const wrapper = mountTable(
      {
        columns: [
          { key: "name", title: "名称", width: "180px" },
          { key: "kind", title: "类型" },
        ],
        columnPinningStorageKey: "data-table-pinning-test",
      },
      { actions: "操作" },
    );
    await nextTick();

    expect(
      wrapper.find('thead th[data-column-id="name"]').attributes("style"),
    ).toContain("left: 0px");
    expect(
      wrapper.find('thead th[data-column-id="actions"]').attributes("style"),
    ).toContain("right: 0px");
    localStorage.removeItem("data-table-pinning-test");
  });

  it("keeps persistent selection keys across page data changes", async () => {
    const wrapper = mountTable({
      selectable: true,
      selectionScope: "persistent",
      selectedKeys: [1],
      data: [{ id: 2, name: "two" }],
    });
    await wrapper.find('tbody [data-slot="checkbox"]').trigger("click");
    expect(wrapper.emitted("selection-change")?.at(-1)).toEqual([[1, 2]]);

    await wrapper.setProps({ data: [{ id: 3, name: "three" }] });
    expect(wrapper.emitted("update:selectedKeys")?.at(-1)).toEqual([[1, 2]]);
  });
});
