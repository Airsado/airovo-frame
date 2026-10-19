<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import type {
  CodeEditorConfiguration,
  CodeEditorInstance,
  CodeEditorProps,
} from "./types";

defineOptions({ name: "CodeEditor" });
const props = withDefaults(defineProps<CodeEditorProps>(), {
  modelValue: "",
  language: "javascript",
  readOnly: false,
  disabled: false,
  height: 320,
  placeholder: "",
  lineWrapping: true,
  ariaLabel: "代码编辑器",
});
const emit = defineEmits<{
  "update:modelValue": [value: string];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  ready: [];
  error: [error: unknown];
}>();
const host = ref<HTMLDivElement>();
const loading = ref(true);
const failed = ref(false);
const dark = ref(false);
const instance = shallowRef<CodeEditorInstance>();
let disposed = false;
let observer: MutationObserver | undefined;

const configuration = computed<CodeEditorConfiguration>(() => {
  const attributes: Record<string, string> = { "aria-label": props.ariaLabel };
  if (props.id) attributes.id = props.id;
  if (props.name) attributes.name = props.name;
  if (props.ariaLabelledby)
    attributes["aria-labelledby"] = props.ariaLabelledby;
  if (props.ariaDescribedby)
    attributes["aria-describedby"] = props.ariaDescribedby;
  if (props.ariaInvalid !== undefined)
    attributes["aria-invalid"] = String(props.ariaInvalid);
  if (props.ariaRequired !== undefined)
    attributes["aria-required"] = String(props.ariaRequired);
  if (props.dataFormRoot) attributes["data-form-root"] = props.dataFormRoot;
  return {
    language: props.language,
    readOnly: props.readOnly,
    disabled: props.disabled,
    placeholder: props.placeholder,
    lineWrapping: props.lineWrapping,
    dark: dark.value,
    attributes,
  };
});
const style = computed(() => ({
  height: typeof props.height === "number" ? `${props.height}px` : props.height,
}));
watch(
  () => props.modelValue,
  (value) => instance.value?.setValue(value),
);
watch(configuration, (value) => instance.value?.configure(value));

onMounted(async () => {
  const updateTheme = () => {
    dark.value = document.documentElement.classList.contains("dark");
  };
  updateTheme();
  observer = new MutationObserver(updateTheme);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  try {
    const { createCodeEditor } = await import("./runtime");
    // Imports can finish after a modal closes. Never recreate a detached view.
    if (disposed || !host.value) return;
    instance.value = createCodeEditor({
      parent: host.value,
      value: props.modelValue,
      configuration: configuration.value,
      onChange: (value) => emit("update:modelValue", value),
      onFocus: (event) => emit("focus", event),
      onBlur: (event) => emit("blur", event),
    });
    loading.value = false;
    emit("ready");
  } catch (error) {
    if (disposed) return;
    loading.value = false;
    failed.value = true;
    emit("error", error);
  }
});
onBeforeUnmount(() => {
  disposed = true;
  observer?.disconnect();
  instance.value?.destroy();
  instance.value = undefined;
});
defineExpose({ focus: () => instance.value?.focus() });
</script>

<template>
  <div
    data-slot="code-editor"
    :data-form-root="dataFormRoot"
    :aria-busy="loading"
    :style="style"
    :class="[
      'relative min-h-0 min-w-0 overflow-hidden rounded-md border border-input bg-background text-foreground outline-transparent transition-colors focus-within:border-ring focus-within:outline-3 focus-within:outline-solid focus-within:-outline-offset-3 focus-within:outline-ring/50',
      'has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:outline-destructive/20 dark:has-[[aria-invalid=true]]:outline-destructive/40',
      disabled && 'bg-input/30 opacity-60',
    ]"
  >
    <!-- Draw focus inside the root boundary and above these editor panels. -->
    <div
      ref="host"
      class="code-editor-host h-full min-h-0 min-w-0"
      :class="{ 'code-editor-dark': dark }"
    />
    <div
      v-if="loading"
      role="status"
      class="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
    >
      加载代码编辑器…
    </div>
    <div
      v-else-if="failed"
      role="alert"
      class="absolute inset-0 flex items-center justify-center px-4 text-sm text-destructive"
    >
      代码编辑器加载失败，请刷新后重试。
    </div>
  </div>
</template>

<style scoped>
.code-editor-host :deep(.tok-keyword) {
  color: #7e22ce;
}
.code-editor-host :deep(.tok-string) {
  color: #166534;
}
.code-editor-host :deep(.tok-number),
.code-editor-host :deep(.tok-bool) {
  color: #9a3412;
}
.code-editor-host :deep(.tok-comment) {
  color: var(--muted-foreground);
  font-style: italic;
}
.code-editor-host :deep(.tok-variableName.tok-function),
.code-editor-host :deep(.tok-definition) {
  color: #1d4ed8;
}
.code-editor-host :deep(.tok-propertyName) {
  color: #115e59;
}
.code-editor-dark :deep(.tok-keyword) {
  color: #d8b4fe;
}
.code-editor-dark :deep(.tok-string) {
  color: #86efac;
}
.code-editor-dark :deep(.tok-number),
.code-editor-dark :deep(.tok-bool) {
  color: #fdba74;
}
.code-editor-dark :deep(.tok-variableName.tok-function),
.code-editor-dark :deep(.tok-definition) {
  color: #93c5fd;
}
.code-editor-dark :deep(.tok-propertyName) {
  color: #5eead4;
}
</style>
