// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import { h, nextTick } from "vue";
import { describe, expect, it } from "vitest";
import JsonField from "./JsonField.vue";
import SelectBox from "../select/SelectBox.vue";

const global = {
  stubs: { Icon: true },
  plugins: [
    createI18n({
      legacy: false,
      locale: "zh-CN",
      messages: {
        "zh-CN": {
          common: {
            jsonKey: "键",
            jsonValue: "值",
            jsonKeyPlaceholder: "字段名",
            jsonValuePlaceholder: "字段值",
            jsonEmptyFields: "暂无字段，点击下方按钮添加。",
            jsonMode: "JSON 模式",
            visualMode: "可视化模式",
            fillTemplate: "回填模板",
            loadTemplate: "加载模板",
            chooseTemplate: "选择模板",
            format: "格式化",
            deleteField: "删除字段",
            addField: "添加字段",
          },
        },
      },
    }),
  ],
};

describe("JsonField", () => {
  it("lets a value slot select an exact ID without changing literal keys or JSON mode", async () => {
    const chosen = "2105964780501078021";
    const wrapper = mount(JsonField, {
      global,
      props: { modelValue: '{"movie.action":"2105964780501078017"}' },
      slots: {
        value: ({ label, updateValue }) =>
          h(
            "button",
            { "aria-label": label, onClick: () => updateValue(chosen) },
            "选择分类",
          ),
      },
    });
    await wrapper.get('button[aria-label="值 1"]').trigger("click");
    expect(
      JSON.parse(wrapper.emitted("update:modelValue")!.at(-1)![0] as string),
    ).toEqual({ "movie.action": chosen });
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "JSON 模式")!
      .trigger("click");
    expect(JSON.parse(wrapper.get("textarea").element.value)).toEqual({
      "movie.action": chosen,
    });
    wrapper.unmount();
  });

  it("preserves raw formatting and value types when only switching modes", async () => {
    const original =
      '{ "count": 2, "enabled": false, "data": { "tags": [1, "2"] } }';
    const wrapper = mount(JsonField, {
      global,
      props: { modelValue: original },
    });

    await wrapper
      .findAll("button")
      .find((button) => button.text() === "JSON 模式")!
      .trigger("click");
    expect((wrapper.get("textarea").element as HTMLTextAreaElement).value).toBe(
      original,
    );
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "可视化模式")!
      .trigger("click");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "JSON 模式")!
      .trigger("click");

    expect((wrapper.get("textarea").element as HTMLTextAreaElement).value).toBe(
      original,
    );
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it.each(['{"name":}', '[{"name":"Ada"}]', "42", "true", "null", '"text"'])(
    "keeps an initial non-visual draft %s in the JSON editor",
    async (original) => {
      const wrapper = mount(JsonField, {
        global,
        props: { modelValue: original },
      });

      expect(
        (wrapper.get("textarea").element as HTMLTextAreaElement).value,
      ).toBe(original);
      expect(wrapper.text()).not.toContain("暂无字段");
      await wrapper
        .findAll("button")
        .find((button) => button.text() === "可视化模式")!
        .trigger("click");

      expect(
        (wrapper.get("textarea").element as HTMLTextAreaElement).value,
      ).toBe(original);
      expect(wrapper.emitted("update:modelValue")).toBeUndefined();
      if (original === '{"name":}') {
        expect(wrapper.emitted("parse-error")?.at(-1)?.[0]).toBeTruthy();
      } else {
        expect(wrapper.emitted("parse-error")).toBeUndefined();
      }
      expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    },
  );

  it("keeps invalid JSON editable until it can safely switch to visual mode", async () => {
    const wrapper = mount(JsonField, {
      global,
      props: { modelValue: '{"name":"Ada"}' },
    });
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "JSON 模式")!
      .trigger("click");
    await wrapper.get("textarea").setValue('{"name":}');
    const updates = wrapper.emitted("update:modelValue")?.length;

    await wrapper
      .findAll("button")
      .find((button) => button.text() === "可视化模式")!
      .trigger("click");
    expect((wrapper.get("textarea").element as HTMLTextAreaElement).value).toBe(
      '{"name":}',
    );
    expect(wrapper.emitted("update:modelValue")).toHaveLength(updates!);
    expect(wrapper.text()).toContain("JSON 格式无效");

    await wrapper.get("textarea").setValue('{"name":"Grace"}');
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "可视化模式")!
      .trigger("click");
    expect(wrapper.find("textarea").exists()).toBe(false);
    expect(
      (wrapper.findAll("input")[1]!.element as HTMLInputElement).value,
    ).toBe("Grace");
    expect(wrapper.emitted("parse-error")?.at(-1)?.[0]).toBeUndefined();
  });

  it("moves external invalid or non-object values to JSON without erasing them", async () => {
    const wrapper = mount(JsonField, {
      global,
      props: { modelValue: '{"name":"Ada"}' },
    });
    expect(wrapper.findAll("input")).toHaveLength(2);

    for (const original of ['{"broken":', "[1, 2]", "false"]) {
      await wrapper.setProps({ modelValue: original });
      expect(
        (wrapper.get("textarea").element as HTMLTextAreaElement).value,
      ).toBe(original);
      expect(wrapper.text()).not.toContain("暂无字段");
    }
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("keeps an empty draft unchanged when switching or attempting to format", async () => {
    const wrapper = mount(JsonField, { global, props: { modelValue: "" } });
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "JSON 模式")!
      .trigger("click");
    const formatButtons = wrapper
      .findAll("button")
      .filter((button) => button.text() === "格式化");
    for (const button of formatButtons) {
      expect(button.attributes("disabled")).toBeDefined();
      await button.trigger("click");
    }
    expect((wrapper.get("textarea").element as HTMLTextAreaElement).value).toBe(
      "",
    );
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("labels visual inputs using the configured column names", () => {
    const wrapper = mount(JsonField, {
      global,
      props: {
        modelValue: '{"35":"1"}',
        keyLabel: "资源站分类 ID",
        valueLabel: "本地分类 ID",
      },
    });
    expect(
      wrapper.findAll("input").map((input) => input.attributes("aria-label")),
    ).toEqual(["资源站分类 ID 1", "本地分类 ID 1"]);
  });

  it("fills a template and exposes visual editing updates", async () => {
    const wrapper = mount(JsonField, {
      global,
      props: { modelValue: "", template: { endpoint: "/v1", timeout: 30 } },
    });
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "回填模板")
      ?.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toContain(
      "endpoint",
    );
    expect(wrapper.findAll("input")).toHaveLength(4);
    await wrapper.findAll("input")[1]!.setValue("/v2");
    expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toContain("/v2");
  });

  it("selects a named template without replacing an existing draft until loaded", async () => {
    const wrapper = mount(JsonField, {
      global,
      props: {
        modelValue: '{"timeout":19}',
        valueType: "any",
        templates: [
          {
            label: "快速请求",
            value: { timeout: 5 },
            description: "适合低延迟请求",
          },
          {
            label: "稳定请求",
            value: { timeout: 60 },
            description: "允许较长的响应时间",
          },
        ],
      },
    });
    const picker = wrapper.getComponent(SelectBox);
    expect(picker.props("modelValue")).toBe("0");
    expect(picker.props("options")).toEqual([
      { label: "快速请求", value: "0" },
      { label: "稳定请求", value: "1" },
    ]);
    expect(picker.get('[role="combobox"]').attributes("aria-label")).toBe(
      "选择模板",
    );
    expect(wrapper.text()).toContain("适合低延迟请求");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();

    picker.vm.$emit("update:modelValue", "1");
    await nextTick();
    expect(wrapper.text()).toContain("允许较长的响应时间");
    expect(wrapper.findAll("input")[1]!.element.value).toBe("19");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();

    await wrapper
      .findAll("button")
      .find((button) => button.text() === "加载模板")!
      .trigger("click");
    expect(
      JSON.parse(wrapper.emitted("update:modelValue")!.at(-1)![0] as string),
    ).toEqual({ timeout: 60 });
    expect(wrapper.findAll("input")[1]!.element.value).toBe("60");
    wrapper.unmount();
  });

  it("preserves JSON types when a loaded template is edited visually", async () => {
    const wrapper = mount(JsonField, {
      global,
      props: {
        modelValue: "",
        valueType: "any",
        templates: [
          {
            label: "连接选项",
            value: {
              timeout: 30,
              retry: false,
              headers: { accept: "application/json" },
            },
          },
        ],
      },
    });
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "加载模板")!
      .trigger("click");
    const loaded = JSON.parse(
      wrapper.emitted("update:modelValue")!.at(-1)![0] as string,
    );
    expect(loaded).toEqual({
      timeout: 30,
      retry: false,
      headers: { accept: "application/json" },
    });
    await wrapper.findAll("input")[1]!.setValue("45");
    expect(
      JSON.parse(wrapper.emitted("update:modelValue")!.at(-1)![0] as string),
    ).toEqual({
      timeout: 45,
      retry: false,
      headers: { accept: "application/json" },
    });
    wrapper.unmount();
  });

  it("handles template reorder, removal and clearing without writing values", async () => {
    const first = { label: "快速请求", value: { timeout: 5 } };
    const second = { label: "稳定请求", value: { timeout: 60 } };
    const wrapper = mount(JsonField, {
      global,
      props: { modelValue: '{"timeout":19}', templates: [first, second] },
    });
    wrapper.getComponent(SelectBox).vm.$emit("update:modelValue", "1");
    await nextTick();
    await wrapper.setProps({ templates: [second, first] });
    expect(wrapper.getComponent(SelectBox).props("modelValue")).toBe("0");
    await wrapper.setProps({ templates: [first] });
    expect(wrapper.getComponent(SelectBox).props("modelValue")).toBe("0");
    await wrapper.setProps({ templates: [] });
    expect(wrapper.findComponent(SelectBox).exists()).toBe(false);
    expect(
      wrapper.findAll("button").some((button) => button.text() === "加载模板"),
    ).toBe(false);
    expect(wrapper.findAll("input")[1]!.element.value).toBe("19");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    wrapper.unmount();
  });

  it("applies external values without loading the selected template", async () => {
    const wrapper = mount(JsonField, {
      global,
      props: {
        modelValue: "",
        templates: [{ label: "标准请求", value: { timeout: 30 } }],
      },
    });
    await wrapper.setProps({ modelValue: '{"timeout":72}' });
    expect(wrapper.findAll("input")[1]!.element.value).toBe("72");
    await wrapper.setProps({
      templates: [{ label: "另一模板", value: { timeout: 45 } }],
    });
    expect(wrapper.findAll("input")[1]!.element.value).toBe("72");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    wrapper.unmount();
  });

  it("keeps a selected stable template when its list is reloaded", async () => {
    const wrapper = mount(JsonField, {
      global,
      props: {
        modelValue: "",
        templates: [
          { id: "fast", label: "快速请求", value: { timeout: 5 } },
          { id: "stable", label: "稳定请求", value: { timeout: 60 } },
        ],
      },
    });
    wrapper.getComponent(SelectBox).vm.$emit("update:modelValue", "1");
    await nextTick();
    await wrapper.setProps({
      templates: [
        { id: "fast", label: "快速请求", value: { timeout: 10 } },
        { id: "stable", label: "稳定请求", value: { timeout: 90 } },
      ],
    });
    expect(wrapper.getComponent(SelectBox).props("modelValue")).toBe("1");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "加载模板")!
      .trigger("click");
    expect(
      JSON.parse(wrapper.emitted("update:modelValue")!.at(-1)![0] as string),
    ).toEqual({ timeout: 90 });
    wrapper.unmount();
  });

  it("disables template selection and loading with the field", async () => {
    const wrapper = mount(JsonField, {
      global,
      props: {
        modelValue: "",
        disabled: true,
        templates: [{ label: "标准请求", value: { timeout: 30 } }],
      },
    });
    expect(wrapper.getComponent(SelectBox).props("disabled")).toBe(true);
    const loadButton = wrapper
      .findAll("button")
      .find((button) => button.text() === "加载模板")!;
    expect(loadButton.element.disabled).toBe(true);
    await loadButton.trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    wrapper.unmount();
  });

  it("keeps invalid raw JSON visible and emits a parse error", async () => {
    const wrapper = mount(JsonField, {
      global,
      props: { modelValue: '{"ok":true}' },
    });
    await wrapper.findAll("button")[0]!.trigger("click");
    const textarea = wrapper.get("textarea");
    await textarea.setValue('{"ok":}');
    expect(wrapper.text()).toContain("JSON 格式无效");
    expect(wrapper.emitted("parse-error")?.at(-1)?.[0]).toBeTruthy();
  });

  it("shows nested paths in visual mode when nested is enabled", () => {
    const wrapper = mount(JsonField, {
      global,
      props: { modelValue: '{"server":{"host":"localhost"}}', nested: true },
    });
    expect(
      wrapper
        .findAll("input")
        .map((input) => (input.element as HTMLInputElement).value),
    ).toContain("server.host");
  });

  it("keeps an invalid number draft visible and does not publish null", async () => {
    const wrapper = mount(JsonField, {
      global,
      props: { modelValue: '{"age":30}', valueType: "number" },
    });
    const valueInput = wrapper.findAll("input")[1]!;
    await valueInput.setValue("oops");

    expect((valueInput.element as HTMLInputElement).value).toBe("oops");
    expect(wrapper.emitted("update:modelValue") ?? []).toHaveLength(0);
    expect(wrapper.emitted("parse-error")?.at(-1)?.[0]).toContain("必须是数字");

    await valueInput.setValue("42");
    expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toContain("42");
  });

  it("forwards form attributes to the JSON editor textarea", async () => {
    const wrapper = mount(JsonField, {
      global,
      attrs: {
        id: "config-json",
        name: "config",
        "aria-describedby": "config-help",
        "aria-invalid": "true",
        "data-form-root": "settings-form",
      },
      props: { modelValue: '{"enabled":true}' },
    });

    await wrapper.findAll("button")[0]!.trigger("click");
    const textarea = wrapper.get("textarea");

    expect(textarea.attributes("id")).toBe("config-json");
    expect(textarea.attributes("name")).toBe("config");
    expect(textarea.attributes("aria-describedby")).toBe("config-help");
    expect(textarea.attributes("aria-invalid")).toBe("true");
    expect(textarea.attributes("data-form-root")).toBe("settings-form");
    expect(wrapper.attributes("data-form-root")).toBe("settings-form");
    expect(
      wrapper
        .getComponent({ name: "JsonCodeEditor" })
        .attributes("data-form-root"),
    ).toBe("settings-form");
  });

  it("matches new-api visual density and uses a template as the JSON placeholder", async () => {
    const wrapper = mount(JsonField, {
      global,
      props: { modelValue: "", template: { endpoint: "/v1" } },
    });
    expect(wrapper.classes()).toContain("space-y-2");
    expect(wrapper.find(".h-24").exists()).toBe(true);
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "JSON 模式")
      ?.trigger("click");
    expect(wrapper.get("textarea").attributes("placeholder")).toContain(
      "endpoint",
    );
    expect(wrapper.find(".h-10.w-10").exists()).toBe(false);
  });
});
