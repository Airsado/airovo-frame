// @vitest-environment happy-dom
import { indentMore, insertTab, undo, redo } from "@codemirror/commands";
import { syntaxTree } from "@codemirror/language";
import { foldCode, unfoldCode } from "@codemirror/language";
import { openSearchPanel } from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import CodeEditor from "./CodeEditor.vue";

const wrappers: VueWrapper[] = [];
function attach(props = {}) {
  const wrapper = mount(CodeEditor, { props, attachTo: document.body });
  wrappers.push(wrapper);
  return wrapper;
}
async function ready(wrapper: VueWrapper) {
  await vi.waitFor(() =>
    expect(wrapper.find(".cm-editor").exists()).toBe(true),
  );
  return EditorView.findFromDOM(
    wrapper.get(".cm-editor").element as HTMLElement,
  )!;
}
afterEach(async () => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  await flushPromises();
  document.body.replaceChildren();
  document.documentElement.classList.remove("dark");
  vi.restoreAllMocks();
});

describe("CodeEditor with the real CodeMirror engine", () => {
  it("renders highlighted lines and does not execute the supplied source", async () => {
    const source = 'throw new Error("This must never execute");';
    const wrapper = attach({ modelValue: source });
    const view = await ready(wrapper);
    expect(view.state.doc.toString()).toBe(source);
    expect(wrapper.find(".cm-lineNumbers").exists()).toBe(true);
    expect(wrapper.find(".cm-foldGutter").exists()).toBe(true);
    expect(wrapper.find(".tok-keyword").exists()).toBe(true);
    expect(wrapper.emitted("ready")).toHaveLength(1);
    expect(wrapper.emitted("error")).toBeUndefined();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("keeps the view and unchanged selection during external synchronization without an echo", async () => {
    const wrapper = attach({ modelValue: "const answer = 1;" });
    const view = await ready(wrapper);
    view.dispatch({ selection: { anchor: 6, head: 12 } });
    await wrapper.setProps({ modelValue: "const answer = 42;" });
    expect(await ready(wrapper)).toBe(view);
    expect(view.state.doc.toString()).toBe("const answer = 42;");
    expect(view.state.selection.main.from).toBe(6);
    expect(view.state.selection.main.to).toBe(12);
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    expect(undo(view)).toBe(false);
  });

  it("supports editing, Tab indentation, undo and redo without resetting history on parent echoes", async () => {
    const wrapper = attach({ modelValue: "value" });
    const view = await ready(wrapper);
    view.dispatch({ selection: { anchor: 0 } });
    expect(insertTab(view)).toBe(true);
    const changed = view.state.doc.toString();
    expect(changed).not.toBe("value");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([changed]);
    await wrapper.setProps({ modelValue: changed });
    expect(undo(view)).toBe(true);
    expect(view.state.doc.toString()).toBe("value");
    expect(redo(view)).toBe(true);
    expect(view.state.doc.toString()).toBe(changed);
  });

  it("reconfigures language, wrapping and theme without replacing the document or view", async () => {
    const wrapper = attach({ modelValue: '{"enabled": true}' });
    const view = await ready(wrapper);
    const document = view.state.doc;
    await wrapper.setProps({ language: "json", lineWrapping: false });
    expect(syntaxTree(view.state).topNode.name).toBe("JsonText");
    expect(view.state.doc).toBe(document);
    expect(wrapper.find(".cm-lineWrapping").exists()).toBe(false);
    await wrapper.setProps({ language: "typescript", lineWrapping: true });
    expect(syntaxTree(view.state).topNode.name).toBe("Script");
    expect(wrapper.find(".cm-lineWrapping").exists()).toBe(true);
    globalThis.document.documentElement.classList.add("dark");
    await vi.waitFor(() =>
      expect(view.state.facet(EditorView.darkTheme)).toBe(true),
    );
    expect(wrapper.find(".code-editor-dark").exists()).toBe(true);
    expect(await ready(wrapper)).toBe(view);
  });

  it("provides code folding and searchable read-only content", async () => {
    const wrapper = attach({
      modelValue: 'function example() {\n  return "searchable";\n}',
      readOnly: true,
    });
    const view = await ready(wrapper);
    view.dispatch({ selection: { anchor: 0 } });
    expect(foldCode(view)).toBe(true);
    expect(wrapper.find(".cm-foldPlaceholder").exists()).toBe(true);
    expect(unfoldCode(view)).toBe(true);
    expect(openSearchPanel(view)).toBe(true);
    expect(wrapper.find('.cm-search input[name="search"]').exists()).toBe(true);
    expect(view.state.doc.toString()).toContain("searchable");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("keeps read-only code selectable and prevents disabled editors from being focused or changed", async () => {
    const wrapper = attach({ modelValue: "const value = 1", readOnly: true });
    const view = await ready(wrapper);
    expect(view.state.facet(EditorState.readOnly)).toBe(true);
    expect(view.contentDOM.getAttribute("contenteditable")).toBe("true");
    expect(view.contentDOM.getAttribute("tabindex")).toBe("0");
    expect(indentMore(view)).toBe(false);
    await wrapper.setProps({ readOnly: false, disabled: true });
    expect(view.contentDOM.getAttribute("contenteditable")).toBe("false");
    expect(view.contentDOM.getAttribute("tabindex")).toBe("-1");
    expect(view.contentDOM.getAttribute("aria-disabled")).toBe("true");
    const focus = vi.spyOn(view, "focus");
    (wrapper.vm as unknown as { focus: () => void }).focus();
    expect(focus).not.toHaveBeenCalled();
    await wrapper.setProps({ disabled: false });
    expect(insertTab(view)).toBe(true);
  });

  it("forwards form accessibility attributes and focus events to the editor", async () => {
    const wrapper = attach({
      id: "plugin-source",
      name: "source",
      ariaLabel: "插件源码",
      ariaDescribedby: "source-help",
      ariaLabelledby: "source-label",
      ariaInvalid: true,
      ariaRequired: true,
      dataFormRoot: "source-form",
      height: "45vh",
      placeholder: "输入 JavaScript",
    });
    const view = await ready(wrapper);
    const content = wrapper.get('[role="textbox"]');
    expect(content.attributes()).toMatchObject({
      id: "plugin-source",
      name: "source",
      "aria-label": "插件源码",
      "aria-describedby": "source-help",
      "aria-labelledby": "source-label",
      "aria-invalid": "true",
      "aria-required": "true",
      "data-form-root": "source-form",
      "aria-multiline": "true",
    });
    expect(wrapper.attributes("style")).toContain("45vh");
    expect(wrapper.text()).toContain("输入 JavaScript");
    (wrapper.vm as unknown as { focus: () => void }).focus();
    expect(wrapper.emitted("focus")).toHaveLength(1);
    view.contentDOM.blur();
    expect(wrapper.emitted("blur")).toHaveLength(1);
  });

  it("destroys the editor and observer on unmount and ignores an import that completes after unmount", async () => {
    const wrapper = attach({ modelValue: "const value = 1;" });
    const view = await ready(wrapper);
    const destroy = vi.spyOn(view, "destroy");
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    wrapper.unmount();
    expect(destroy).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalled();
    const late = attach();
    late.unmount();
    await flushPromises();
    expect(late.emitted("ready")).toBeUndefined();
    expect(globalThis.document.querySelector(".cm-editor")).toBeNull();
  });
});
