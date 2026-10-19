<script setup lang="ts">
import { Button, Input, Textarea } from "../controls";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  shallowRef,
  useAttrs,
  useId,
  watch,
} from "vue";
import { Editor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

import {
  Bold,
  Italic,
  Underline,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Undo2,
  Redo2,
} from "@lucide/vue";
import { NEW_API_INPUT_CLASS } from "../data-table/new-api-compat";
import { inspectRichTextHTML, isSafeRichTextURL } from "./rich-text-html";

defineOptions({ name: "RichTextEditor", inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    modelValue?: string;
    id?: string;
    ariaLabel?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    minHeight?: number | string;
    maxHeight?: number | string;
    /** Change when opening another document/session, even if its HTML is identical. */
    resetKey?: string | number;
  }>(),
  {
    modelValue: "",
    ariaLabel: "富文本正文",
    disabled: false,
    readonly: false,
    minHeight: 240,
    maxHeight: 400,
  },
);
const emit = defineEmits<{
  "update:modelValue": [value: string];
  blur: [event: FocusEvent];
}>();
const attrs = useAttrs();
const instanceId = useId().replace(/:/g, "");
const editorId = computed(() => props.id ?? `rich-text-${instanceId}`);
const linkInputId = computed(() => `${editorId.value}-link`);
const editor = shallowRef<Editor>();
const source = ref(props.modelValue);
const mode = ref<"visual" | "source">("visual");
const sourceOnly = ref(false);
const transactionVersion = ref(0);
const linkOpen = ref(false);
const linkURL = ref("");
const linkError = ref("");
let mounted = false;
let lastEmission: string | undefined;
let linkRange: { from: number; to: number } | undefined;
const locked = computed(() => props.disabled || props.readonly);
const cssSize = (value: string | number) =>
  typeof value === "number" ? `${value}px` : value;
const surfaceStyle = computed(() => ({
  minHeight: cssSize(props.minHeight),
  maxHeight: cssSize(props.maxHeight),
}));
const rootStyle = computed(() => ({
  "--rich-text-min-height": cssSize(props.minHeight),
}));
// The stock image extension accepts arbitrary Markdown image URLs. Only existing
// safe image URLs are supported; this component owns no upload or image command UI.
const SafeImage = Image.extend({
  parseHTML() {
    return [
      {
        tag: "img[src]",
        getAttrs: (node) =>
          isSafeRichTextURL(node.getAttribute("src")) ? null : false,
      },
    ];
  },
  addInputRules() {
    return [];
  },
});

function editorAttributes(): Record<string, string> {
  const aria: Record<string, string> = {};
  for (const name of [
    "aria-invalid",
    "aria-required",
    "aria-describedby",
    "aria-labelledby",
  ]) {
    if (attrs[name] !== undefined) aria[name] = String(attrs[name]);
  }
  return {
    ...aria,
    id: editorId.value,
    role: "textbox",
    "aria-label": props.ariaLabel,
    "aria-multiline": "true",
    "aria-readonly": String(locked.value),
    "aria-disabled": String(props.disabled),
    "data-placeholder": props.placeholder ?? "",
    class:
      "rich-text-content min-w-0 px-2.5 py-2 text-sm text-foreground outline-none",
  };
}

function publish(value: string): void {
  if (locked.value) return;
  source.value = value;
  lastEmission = value;
  emit("update:modelValue", value);
}

function focusFromLabel(event: MouseEvent): void {
  if (
    props.disabled ||
    mode.value !== "visual" ||
    !(event.target instanceof Element)
  )
    return;
  const label = event.target.closest("label");
  if (label?.htmlFor !== editorId.value) return;
  // A contenteditable div is not a native labelable control. Preserve the
  // framework form's existing label/for contract without a hidden extra input.
  event.preventDefault();
  editor.value?.commands.focus();
}

function resetEditor(value: string): void {
  editor.value?.destroy();
  editor.value = undefined;
  linkOpen.value = false;
  linkRange = undefined;
  source.value = value;
  const inspected = inspectRichTextHTML(value);
  sourceOnly.value = inspected.sourceOnly;
  mode.value = inspected.sourceOnly ? "source" : "visual";
  const next = new Editor({
    content: inspected.html,
    editable: !locked.value,
    parseOptions: { preserveWhitespace: "full" },
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: false,
          linkOnPaste: false,
          isAllowedUri: isSafeRichTextURL,
        },
      }),
      SafeImage.configure({ allowBase64: false }),
    ],
    editorProps: {
      attributes: editorAttributes(),
      transformPastedHTML: (html) => inspectRichTextHTML(html).html,
      // No implicit file uploader or data URL insertion is created.
      handleDrop: (_view, event) => Boolean(event.dataTransfer?.files.length),
      handlePaste: (_view, event) => Boolean(event.clipboardData?.files.length),
    },
    onUpdate: ({ editor: current }) => {
      if (editor.value !== current || mode.value !== "visual") return;
      publish(current.isEmpty ? "" : current.getHTML());
    },
    onTransaction: () => transactionVersion.value++,
    onBlur: ({ event }) => emit("blur", event),
  });
  editor.value = next;
}

watch(
  () => [props.modelValue, props.resetKey] as const,
  ([value, key], [, previousKey]) => {
    if (!mounted) return;
    // Parent echoes keep the current selection/history; external replacements
    // create a fresh editor so Undo cannot recover a different entity's data.
    if (key === previousKey && value === lastEmission) {
      lastEmission = undefined;
      return;
    }
    lastEmission = undefined;
    resetEditor(value);
  },
);
watch(locked, (value) => editor.value?.setEditable(!value, false));
onUpdated(() => {
  // useAttrs is updated with the parent render rather than being watchable.
  // Refresh only view attributes; this does not create a document transaction.
  const current = editor.value;
  if (current)
    current.setOptions({
      editorProps: {
        ...current.options.editorProps,
        attributes: editorAttributes(),
      },
    });
});
onMounted(() => {
  mounted = true;
  resetEditor(props.modelValue);
  document.addEventListener("click", focusFromLabel);
});
onBeforeUnmount(() => {
  mounted = false;
  document.removeEventListener("click", focusFromLabel);
  editor.value?.destroy();
  editor.value = undefined;
});

function switchMode(next: "visual" | "source"): void {
  if (next === "visual") {
    const inspected = inspectRichTextHTML(source.value);
    sourceOnly.value = inspected.sourceOnly;
    if (inspected.sourceOnly) return;
    editor.value?.commands.setContent(inspected.html, {
      emitUpdate: false,
      parseOptions: { preserveWhitespace: "full" },
    });
  }
  mode.value = next;
  linkOpen.value = false;
}
function updateSource(value: string | number): void {
  publish(String(value));
  sourceOnly.value = inspectRichTextHTML(String(value)).sourceOnly;
}
const actions = [
  {
    name: "bold",
    label: "加粗",
    icon: Bold,
    run: () => editor.value?.chain().focus().toggleBold().run(),
  },
  {
    name: "italic",
    label: "斜体",
    icon: Italic,
    run: () => editor.value?.chain().focus().toggleItalic().run(),
  },
  {
    name: "underline",
    label: "下划线",
    icon: Underline,
    run: () => editor.value?.chain().focus().toggleUnderline().run(),
  },
  {
    name: "heading",
    label: "二级标题",
    icon: Heading2,
    run: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    name: "bulletList",
    label: "无序列表",
    icon: List,
    run: () => editor.value?.chain().focus().toggleBulletList().run(),
  },
  {
    name: "orderedList",
    label: "有序列表",
    icon: ListOrdered,
    run: () => editor.value?.chain().focus().toggleOrderedList().run(),
  },
  {
    name: "blockquote",
    label: "引用",
    icon: Quote,
    run: () => editor.value?.chain().focus().toggleBlockquote().run(),
  },
];
function openLink(): void {
  if (!editor.value || locked.value) return;
  const { from, to } = editor.value.state.selection;
  linkRange = { from, to };
  linkURL.value = String(editor.value.getAttributes("link").href ?? "");
  linkError.value = "";
  linkOpen.value = !linkOpen.value;
  if (linkOpen.value)
    nextTick(() => document.getElementById(linkInputId.value)?.focus());
}
function applyLink(): void {
  if (!editor.value || !linkRange || locked.value) return;
  const url = linkURL.value.trim();
  if (url && !isSafeRichTextURL(url)) {
    linkError.value = "请输入安全的网页、邮件或站内链接。";
    return;
  }
  const chain = editor.value
    .chain()
    .focus()
    .setTextSelection(linkRange)
    .extendMarkRange("link");
  if (url) chain.setLink({ href: url }).run();
  else chain.unsetLink().run();
  linkOpen.value = false;
}
</script>

<template>
  <div
    v-bind="attrs"
    data-slot="rich-text-editor"
    class="min-w-0 overflow-hidden rounded-lg border border-input bg-background text-foreground outline-transparent transition-colors focus-within:border-ring focus-within:outline-3 focus-within:outline-solid focus-within:-outline-offset-3 focus-within:outline-ring/50 aria-invalid:border-destructive aria-invalid:outline-destructive/20 dark:aria-invalid:outline-destructive/40 dark:bg-input/30"
    :class="{ 'opacity-50': disabled }"
    :style="rootStyle"
    :data-transaction="transactionVersion"
  >
    <div
      class="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5"
      role="group"
      aria-label="正文编辑方式"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        :class="mode === 'visual' ? 'bg-muted' : ''"
        :aria-pressed="mode === 'visual'"
        :disabled="disabled || sourceOnly"
        @click="switchMode('visual')"
        >可视化</Button
      >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        :class="mode === 'source' ? 'bg-muted' : ''"
        :aria-pressed="mode === 'source'"
        :disabled="disabled"
        @click="switchMode('source')"
        >HTML 源码</Button
      >
      <template v-if="mode === 'visual'">
        <span class="mx-1 h-4 w-px bg-border" aria-hidden="true" />
        <Button
          v-for="action in actions"
          :key="action.name"
          type="button"
          variant="ghost"
          size="icon-sm"
          :class="editor?.isActive(action.name) ? 'bg-muted' : ''"
          :aria-label="action.label"
          :title="action.label"
          :aria-pressed="editor?.isActive(action.name) ?? false"
          :disabled="locked"
          @mousedown.prevent
          @click="action.run()"
          ><component :is="action.icon" class="size-3.5"
        /></Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="编辑链接"
          title="编辑链接"
          :disabled="locked"
          @mousedown.prevent
          @click="openLink"
          ><LinkIcon class="size-3.5"
        /></Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="撤销"
          title="撤销"
          :disabled="locked || !editor?.can().undo()"
          @mousedown.prevent
          @click="editor?.chain().focus().undo().run()"
          ><Undo2 class="size-3.5"
        /></Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="重做"
          title="重做"
          :disabled="locked || !editor?.can().redo()"
          @mousedown.prevent
          @click="editor?.chain().focus().redo().run()"
          ><Redo2 class="size-3.5"
        /></Button>
      </template>
    </div>
    <div
      v-if="linkOpen"
      class="flex flex-wrap items-center gap-2 border-b border-border p-2"
    >
      <label class="text-sm" :for="linkInputId">链接地址</label>
      <Input
        :id="linkInputId"
        v-model="linkURL"
        :class="NEW_API_INPUT_CLASS"
        class="min-w-40 flex-1"
        :disabled="locked"
        @keydown.enter.prevent="applyLink"
        @keydown.esc.stop.prevent="linkOpen = false"
      />
      <Button type="button" size="sm" :disabled="locked" @click="applyLink"
        >应用</Button
      >
      <Button type="button" variant="ghost" size="sm" @click="linkOpen = false"
        >取消</Button
      >
      <p v-if="linkError" role="alert" class="w-full text-sm text-destructive">
        {{ linkError }}
      </p>
    </div>
    <p
      v-if="sourceOnly"
      role="status"
      class="border-b border-border bg-muted/50 px-2.5 py-2 text-xs text-muted-foreground"
    >
      当前 HTML 包含可视化编辑器不支持的格式，请在源码中编辑以保留原内容。
    </p>
    <Textarea
      v-if="mode === 'source'"
      :id="editorId"
      :model-value="source"
      :aria-label="`${ariaLabel} HTML 源码`"
      :aria-invalid="attrs['aria-invalid']"
      :aria-required="attrs['aria-required']"
      :aria-describedby="attrs['aria-describedby']"
      :aria-labelledby="attrs['aria-labelledby']"
      :disabled="disabled"
      :readonly="readonly"
      :placeholder="placeholder"
      :style="surfaceStyle"
      class="w-full resize-y rounded-none border-0 bg-transparent px-2.5 py-2 font-mono text-sm shadow-none focus-visible:ring-0 aria-invalid:ring-0"
      @update:model-value="updateSource"
      @blur="emit('blur', $event)"
    />
    <div
      v-else
      :style="surfaceStyle"
      class="overflow-y-auto"
      @click.capture="
        ($event.target as HTMLElement).closest('a') && $event.preventDefault()
      "
    >
      <EditorContent v-if="editor" :editor="editor" />
    </div>
  </div>
</template>

<style scoped>
:deep(.rich-text-content) {
  min-height: var(--rich-text-min-height);
  line-height: 1.7;
  overflow-wrap: anywhere;
}
:deep(.rich-text-content p) {
  margin: 0.5em 0;
}
:deep(.rich-text-content h1),
:deep(.rich-text-content h2),
:deep(.rich-text-content h3),
:deep(.rich-text-content h4),
:deep(.rich-text-content h5),
:deep(.rich-text-content h6) {
  margin: 0.75em 0 0.4em;
  font-weight: 600;
  line-height: 1.35;
}
:deep(.rich-text-content h1) {
  font-size: 1.5em;
}
:deep(.rich-text-content h2) {
  font-size: 1.3em;
}
:deep(.rich-text-content h3) {
  font-size: 1.15em;
}
:deep(.rich-text-content ul) {
  list-style: disc;
  padding-left: 1.5em;
}
:deep(.rich-text-content ol) {
  list-style: decimal;
  padding-left: 1.5em;
}
:deep(.rich-text-content blockquote) {
  border-left: 3px solid var(--border);
  padding-left: 0.75em;
  color: var(--muted-foreground);
}
:deep(.rich-text-content a) {
  color: var(--primary);
  text-decoration: underline;
}
:deep(.rich-text-content img) {
  max-width: 100%;
  height: auto;
}
:deep(.rich-text-content pre) {
  overflow-x: auto;
  border-radius: 0.5rem;
  background: var(--muted);
  padding: 0.75em;
}
:deep(
    .rich-text-content:has(
        > p:only-child > br.ProseMirror-trailingBreak:only-child
      )::before
  ) {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  color: var(--muted-foreground);
}
</style>
