import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { createPersistedState } from "pinia-plugin-persistedstate";
import { createApp } from "vue";
import { nextTick } from "vue";
import { setTabStorageKey, useTabStore } from "./index";

function route(path: string) {
  return {
    path,
    fullPath: path,
    name: path.slice(1) || "home",
    meta: { title: path },
    query: {},
    params: {},
    matched: [],
  } as never;
}

describe("tab storage namespaces", () => {
  beforeEach(() => {
    localStorage.clear();
    setTabStorageKey("framework-tabs:test");
  });

  it("persists each application tab cache under its configured key", async () => {
    const firstPinia = createPinia().use(createPersistedState());
    createApp({}).use(firstPinia);
    setActivePinia(firstPinia);
    setTabStorageKey("framework-tabs:app-one");
    const first = useTabStore();
    first.addOrActivate(route("/reports"));
    await nextTick();

    expect(localStorage.getItem("framework-tabs:app-one")).toContain(
      "/reports",
    );
    expect(localStorage.getItem("framework-tabs:app-two")).toBeNull();

    const secondPinia = createPinia().use(createPersistedState());
    createApp({}).use(secondPinia);
    setActivePinia(secondPinia);
    setTabStorageKey("framework-tabs:app-two");
    const second = useTabStore();

    expect(second.tabs).toHaveLength(0);
    second.addOrActivate(route("/settings"));
    await nextTick();
    expect(localStorage.getItem("framework-tabs:app-two")).toContain(
      "/settings",
    );
    expect(localStorage.getItem("framework-tabs:app-one")).toContain(
      "/reports",
    );
    expect(localStorage.getItem("framework-tabs:app-one")).not.toContain(
      "/settings",
    );
  });
});
