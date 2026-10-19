import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { defineComponent, h, nextTick, type App } from "vue";
import { createMemoryHistory, createRouter, type Router } from "vue-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installTabs, useTabStore } from "../src";
import BasicTabBar from "../src/components/BasicTabBar.vue";

vi.mock("@iconify/vue", () => ({
  Icon: { template: '<span aria-hidden="true" />' },
}));

const observers: ResizeObserverMock[] = [];
class ResizeObserverMock {
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
  constructor(readonly callback: ResizeObserverCallback) {
    observers.push(this);
  }
  trigger() {
    this.callback([], this as unknown as ResizeObserver);
  }
}
let wrapper: VueWrapper | undefined;
let router: Router;
let store: ReturnType<typeof useTabStore>;
let scrollToDescriptor: PropertyDescriptor | undefined;
let scrollByDescriptor: PropertyDescriptor | undefined;
let scrollToMock: ReturnType<typeof vi.fn>;
let scrollByMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  scrollToDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "scrollTo",
  );
  scrollByDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "scrollBy",
  );
  scrollToMock = vi.fn(function (this: HTMLElement, options: ScrollToOptions) {
    this.scrollLeft = options.left ?? this.scrollLeft;
    this.dispatchEvent(new Event("scroll"));
  });
  scrollByMock = vi.fn(function (this: HTMLElement, options: ScrollToOptions) {
    this.scrollLeft += options.left ?? 0;
    this.dispatchEvent(new Event("scroll"));
  });
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: scrollToMock,
  });
  Object.defineProperty(HTMLElement.prototype, "scrollBy", {
    configurable: true,
    value: scrollByMock,
  });
});
afterEach(async () => {
  wrapper?.unmount();
  wrapper = undefined;
  await flushPromises();
  document.body.innerHTML = "";
  document.body.style.pointerEvents = "";
  document.body.style.overflow = "";
  localStorage.clear();
  observers.splice(0);
  if (scrollToDescriptor)
    Object.defineProperty(
      HTMLElement.prototype,
      "scrollTo",
      scrollToDescriptor,
    );
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
  if (scrollByDescriptor)
    Object.defineProperty(
      HTMLElement.prototype,
      "scrollBy",
      scrollByDescriptor,
    );
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollBy");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function settle() {
  await nextTick();
  await flushPromises();
  await new Promise<void>((resolve) => setTimeout(resolve, 15));
}
async function openTabs(paths = ["/a", "/b", "/c", "/d"]) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const Page = defineComponent({
    name: "FixturePage",
    render: () => h("p", "Page"),
  });
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", redirect: "/home" },
      { path: "/home", component: Page, meta: { title: "首页", affix: true } },
      ...["a", "b", "c", "d"].map((name) => ({
        path: `/${name}`,
        component: Page,
        meta: { title: name.toUpperCase() },
      })),
    ],
  });
  await router.push("/home");
  wrapper = mount(BasicTabBar, {
    attachTo: document.body,
    global: {
      plugins: [
        pinia,
        router,
        {
          install: (app: App) => {
            installTabs(app, { router, defaultTabPath: "/home" });
          },
        },
      ],
      stubs: { Icon: true },
    },
  });
  store = useTabStore(pinia);
  for (const path of paths) await router.push(path);
  await settle();
  return wrapper;
}
function tabId(path: string) {
  return store.tabs.find((tab) => tab.fullPath === path)!.id;
}
function tab(path: string) {
  return wrapper!.get(`[data-tab-id="${tabId(path)}"]`);
}
function tabButton(path: string) {
  return tab(path).get('[role="tab"]');
}
function visiblePaths() {
  return wrapper!
    .findAll("[data-tab-id]")
    .map(
      (element) =>
        store.tabs.find(
          (item) => item.id === element.attributes("data-tab-id"),
        )!.fullPath,
    );
}
function currentMenuItems() {
  return [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')];
}
function menuItem(label: string) {
  const item = currentMenuItems().find(
    (element) => element.textContent?.trim() === label,
  );
  expect(item, `menu item ${label}`).toBeDefined();
  return item!;
}
function disabled(element: HTMLElement) {
  return (
    element.hasAttribute("disabled") ||
    element.hasAttribute("data-disabled") ||
    element.getAttribute("aria-disabled") === "true"
  );
}
async function context(path: string) {
  await tab(path).trigger("contextmenu", { clientX: 20, clientY: 20 });
  await settle();
}
async function action(label: string) {
  menuItem(label).click();
  await settle();
}
async function pointerClick(element: HTMLElement) {
  // MenuItem tracks pointerdown to distinguish a click from dragging onto an
  // item. Dispatch the full mouse sequence, not only HTMLElement.click().
  element.dispatchEvent(
    new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
  );
  element.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerType: "mouse",
      isPrimary: true,
    }),
  );
  element.dispatchEvent(
    new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 }),
  );
  await nextTick();
  element.dispatchEvent(
    new PointerEvent("pointerup", {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerType: "mouse",
      isPrimary: true,
    }),
  );
  element.dispatchEvent(
    new MouseEvent("mouseup", { bubbles: true, cancelable: true, button: 0 }),
  );
  element.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
      ctrlKey: false,
    }),
  );
  await settle();
}
async function toolbarMenu() {
  await wrapper!.get('button[aria-label="标签页操作"]').trigger("click", {
    button: 0,
    pointerType: "mouse",
    ctrlKey: false,
  });
  await settle();
}
async function drag(from: string, to: string) {
  const data = new Map<string, string>();
  const dataTransfer = {
    effectAllowed: "",
    dropEffect: "",
    setData: (key: string, value: string) => data.set(key, value),
    getData: (key: string) => data.get(key) ?? "",
  };
  await tab(from).trigger("dragstart", { dataTransfer });
  await tab(to).trigger("dragover", { dataTransfer });
  await tab(to).trigger("drop", { dataTransfer });
  await tab(from).trigger("dragend", { dataTransfer });
  await settle();
}

describe("BasicTabBar with the real router and tab store", () => {
  it("navigates through a tab button and does not activate a tab when navigation is refused", async () => {
    await openTabs();
    await tabButton("/b").trigger("click");
    await settle();
    expect(router.currentRoute.value.fullPath).toBe("/b");
    expect(store.activeTabId).toBe(tabId("/b"));
    router.beforeEach((to) => (to.path === "/a" ? false : undefined));
    await tabButton("/a").trigger("click");
    await settle();
    expect(router.currentRoute.value.fullPath).toBe("/b");
    expect(store.activeTabId).toBe(tabId("/b"));
    expect(tabButton("/b").attributes("aria-selected")).toBe("true");
    expect(tabButton("/a").attributes("aria-selected")).toBe("false");
  });

  it("keeps the active page and its tab when its leave guard rejects closing", async () => {
    await openTabs();
    const activeId = tabId("/d");
    router.beforeEach((to) => (to.path === "/c" ? false : undefined));
    await context("/d");
    await action("关闭当前标签");
    expect(store.tabs.some((item) => item.id === activeId)).toBe(true);
    expect(router.currentRoute.value.path).toBe("/d");
    expect(store.activeTabId).toBe(activeId);
    expect(tabButton("/d").attributes("aria-selected")).toBe("true");
  });

  it("shares all actions between a tab context menu and the active-tab toolbar menu", async () => {
    await openTabs();
    const expected = [
      "刷新",
      "固定标签",
      "最大化",
      "在新窗口打开",
      "关闭当前标签",
      "关闭左侧标签",
      "关闭右侧标签",
      "关闭其他标签",
      "关闭全部标签",
    ];
    await context("/b");
    expect(currentMenuItems().map((item) => item.textContent?.trim())).toEqual(
      expected,
    );
    await action("刷新");
    expect(store.tabs.find((item) => item.path === "/b")?.refreshVersion).toBe(
      1,
    );
    expect(router.currentRoute.value.path).toBe("/d");
    await router.push("/d");
    await settle();
    await toolbarMenu();
    expect(currentMenuItems().map((item) => item.textContent?.trim())).toEqual(
      expected,
    );
    await action("刷新");
    expect(store.tabs.find((item) => item.path === "/d")?.refreshVersion).toBe(
      1,
    );
  });

  it.each(["context", "toolbar"] as const)(
    "runs pin, unpin and refresh exactly once per real pointer click in the %s menu",
    async (kind) => {
      await openTabs();
      const activeId = tabId("/d");
      const pin = vi.spyOn(store, "pinTab");
      const openMenu = async () => {
        if (kind === "context") await context("/d");
        else
          await pointerClick(
            wrapper!.get('button[aria-label="标签页操作"]')
              .element as HTMLElement,
          );
      };
      await openMenu();
      await pointerClick(menuItem("固定标签"));
      expect(pin).toHaveBeenCalledTimes(1);
      expect(store.tabs.find((item) => item.id === activeId)?.pinned).toBe(
        true,
      );
      await openMenu();
      await pointerClick(menuItem("取消固定"));
      expect(pin).toHaveBeenCalledTimes(2);
      expect(store.tabs.find((item) => item.id === activeId)?.pinned).toBe(
        false,
      );
      const before =
        store.tabs.find((item) => item.id === activeId)!.refreshVersion ?? 0;
      await openMenu();
      await pointerClick(menuItem("刷新"));
      expect(
        store.tabs.find((item) => item.id === activeId)?.refreshVersion,
      ).toBe(before + 1);
    },
  );

  it("protects fixed and pinned tabs in menus and middle-click, and allows unpinning only user-fixed tabs", async () => {
    await openTabs();
    await context("/home");
    expect(disabled(menuItem("固定标签"))).toBe(true);
    expect(disabled(menuItem("关闭当前标签"))).toBe(true);
    expect(disabled(menuItem("关闭左侧标签"))).toBe(true);
    escapeMenu();
    await settle();
    await context("/a");
    await action("固定标签");
    expect(store.tabs.find((item) => item.path === "/a")?.pinned).toBe(true);
    await context("/a");
    expect(disabled(menuItem("关闭当前标签"))).toBe(true);
    expect(disabled(menuItem("关闭左侧标签"))).toBe(true);
    expect(disabled(menuItem("取消固定"))).toBe(false);
    escapeMenu();
    await settle();
    await tab("/a").trigger("mousedown", { button: 1 });
    await tab("/a").trigger("auxclick", { button: 1 });
    expect(store.tabs.some((item) => item.path === "/a")).toBe(true);
    await context("/a");
    await action("取消固定");
    expect(store.tabs.find((item) => item.path === "/a")?.pinned).toBe(false);
  });

  it("closes left and right by visual order while preserving pinned tabs and a valid active route", async () => {
    await openTabs();
    store.pinTab(tabId("/a"));
    await settle();
    await context("/c");
    await action("关闭左侧标签");
    expect(visiblePaths()).toEqual(["/home", "/a", "/c", "/d"]);
    await context("/c");
    await action("关闭右侧标签");
    expect(visiblePaths()).toEqual(["/home", "/a", "/c"]);
    expect(router.currentRoute.value.path).toBe("/c");
    expect(store.activeTabId).toBe(tabId("/c"));
  });

  it("keeps fixed tabs during close-others and close-all from the active-tab toolbar", async () => {
    await openTabs();
    store.pinTab(tabId("/a"));
    await settle();
    await toolbarMenu();
    await action("关闭其他标签");
    expect(visiblePaths()).toEqual(["/home", "/a", "/d"]);
    expect(router.currentRoute.value.path).toBe("/d");
    await toolbarMenu();
    await action("关闭全部标签");
    expect(visiblePaths()).toEqual(["/home", "/a"]);
    const active = store.tabs.find((item) => item.id === store.activeTabId)!;
    expect(router.currentRoute.value.fullPath).toBe(active.fullPath);
  });

  it("closes an unpinned tab with the middle mouse button without opening a context menu", async () => {
    await openTabs();
    const id = tabId("/b");
    await tab("/b").trigger("mousedown", { button: 1 });
    const remaining = wrapper!.find(`[data-tab-id="${id}"]`);
    if (remaining.exists()) await remaining.trigger("auxclick", { button: 1 });
    await settle();
    expect(store.tabs.some((item) => item.id === id)).toBe(false);
    expect(currentMenuItems()).toHaveLength(0);
    expect(router.currentRoute.value.path).toBe("/d");
  });

  it("switches tabs with keyboard arrows and closes the focused normal tab with Delete", async () => {
    await openTabs();
    (tabButton("/a").element as HTMLElement).focus();
    await tabButton("/a").trigger("keydown", { key: "ArrowRight" });
    await settle();
    expect(router.currentRoute.value.path).toBe("/b");
    expect(store.activeTabId).toBe(tabId("/b"));
    expect(document.activeElement).toBe(tabButton("/b").element);
    await tabButton("/b").trigger("keydown", { key: "Home" });
    await settle();
    expect(router.currentRoute.value.path).toBe("/home");
    await tabButton("/home").trigger("keydown", { key: "End" });
    await settle();
    expect(router.currentRoute.value.path).toBe("/d");
    const closing = tabId("/d");
    await tabButton("/d").trigger("keydown", { key: "Delete" });
    await settle();
    expect(store.tabs.some((item) => item.id === closing)).toBe(false);
    expect(router.currentRoute.value.path).toBe("/c");
    expect(document.activeElement).toBe(tabButton("/c").element);
  });

  it("moves dragged tabs only within their fixed grouping", async () => {
    await openTabs();
    await drag("/d", "/b");
    expect(visiblePaths()).toEqual(["/home", "/a", "/d", "/b", "/c"]);
    store.pinTab(tabId("/a"));
    store.pinTab(tabId("/c"));
    await settle();
    await drag("/c", "/a");
    expect(visiblePaths()).toEqual(["/home", "/c", "/a", "/d", "/b"]);
    await drag("/a", "/b");
    expect(visiblePaths()).toEqual(["/home", "/c", "/a", "/d", "/b"]);
    await drag("/home", "/b");
    expect(visiblePaths()).toEqual(["/home", "/c", "/a", "/d", "/b"]);
  });

  it("opens a tab in a separate window and toggles the active page maximize state from its toolbar", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    await openTabs();
    await wrapper!.get('button[aria-label="刷新当前页"]').trigger("click");
    await settle();
    expect(store.tabs.find((item) => item.path === "/d")?.refreshVersion).toBe(
      1,
    );
    await context("/b");
    await action("在新窗口打开");
    expect(open).toHaveBeenCalledWith(
      router.resolve("/b").href,
      "_blank",
      expect.stringContaining("noopener"),
    );
    await wrapper!.get('button[aria-label="最大化"]').trigger("click");
    await settle();
    expect(store.maximizedTabId).toBe(store.activeTabId);
    await wrapper!.get('button[aria-label="退出最大化"]').trigger("click");
    await settle();
    expect(store.maximizedTabId).toBeNull();
  });

  it("shows the open-tab menu and navigates its actual menu item", async () => {
    await openTabs();
    await wrapper!.get('button[aria-label="打开的标签页"]').trigger("click", {
      button: 0,
      pointerType: "mouse",
      ctrlKey: false,
    });
    await settle();
    const target = currentMenuItems().find(
      (item) => item.textContent?.trim() === "B",
    )!;
    expect(target).toBeTruthy();
    target.click();
    await settle();
    expect(router.currentRoute.value.path).toBe("/b");
    expect(store.activeTabId).toBe(tabId("/b"));
  });

  it("tracks both overflow edges and turns a vertical mouse wheel into horizontal tab scrolling", async () => {
    await openTabs();
    const host = wrapper!.get('[data-slot="tabs-scroll"]')
      .element as HTMLElement;
    Object.defineProperty(host, "clientWidth", {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(host, "scrollWidth", {
      configurable: true,
      value: 1000,
    });
    host.scrollLeft = 0;
    host.dispatchEvent(new Event("scroll"));
    for (const observer of observers) observer.trigger();
    await settle();
    const left = wrapper!.get('button[aria-label="向左滚动标签"]');
    const right = wrapper!.get('button[aria-label="向右滚动标签"]');
    expect(left.isVisible()).toBe(false);
    expect(right.isVisible()).toBe(true);
    await right.trigger("click");
    expect(host.scrollLeft).toBeGreaterThan(0);
    host.scrollLeft = 700;
    host.dispatchEvent(new Event("scroll"));
    await settle();
    expect(right.isVisible()).toBe(false);
    expect(left.isVisible()).toBe(true);
    await left.trigger("click");
    expect(host.scrollLeft).toBeLessThan(700);
    const beforeWheel = host.scrollLeft;
    const wheel = new WheelEvent("wheel", {
      deltaY: 70,
      bubbles: true,
      cancelable: true,
    });
    host.dispatchEvent(wheel);
    await settle();
    expect(host.scrollLeft).toBe(beforeWheel + 70);
    expect(wheel.defaultPrevented).toBe(true);
  });

  it("disconnects ResizeObserver and removes any registered window listeners on unmount", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    await openTabs();
    const host = wrapper!.get('[data-slot="tabs-scroll"]').element;
    expect(
      observers.some((observer) =>
        observer.observe.mock.calls.some(([element]) => element === host),
      ),
    ).toBe(true);
    const resizeHandlers = add.mock.calls
      .filter(([event]) => event === "resize")
      .map(([, callback]) => callback);
    wrapper!.unmount();
    wrapper = undefined;
    await settle();
    expect(observers.length).toBeGreaterThan(0);
    for (const observer of observers)
      expect(observer.disconnect).toHaveBeenCalled();
    for (const handler of resizeHandlers)
      expect(remove).toHaveBeenCalledWith("resize", handler);
  });
});

function escapeMenu() {
  document.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    }),
  );
}
