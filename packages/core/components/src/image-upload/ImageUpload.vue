<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import Button from "../controls/Button.vue";
import type { ImageUploadProps } from "./types";

defineOptions({ name: "ImageUpload", inheritAttrs: false });
const props = withDefaults(defineProps<ImageUploadProps>(), {
  modelValue: "",
  accept: "image/jpeg,image/png,image/gif",
  label: "上传图片",
  disabled: false,
  readonly: false,
});
const emit = defineEmits<{
  "update:modelValue": [value: string];
  "busy-change": [busy: boolean];
  uploaded: [value: string];
  error: [error: Error];
  blur: [event: FocusEvent];
}>();
const input = ref<HTMLInputElement>();
const busy = ref(false);
const progress = ref<number>();
const error = ref("");
const dragging = ref(false);
const failedFile = ref<File>();
const previewFailed = ref(false);
const locked = computed(() => props.disabled || props.readonly);
let controller: AbortController | undefined;
let generation = 0;

function cancel(): void {
  generation++;
  controller?.abort();
  controller = undefined;
  busy.value = false;
  progress.value = undefined;
  dragging.value = false;
  emit("busy-change", false);
}

function accepts(file: File): boolean {
  return props.accept.split(",").some((part) => {
    const token = part.trim().toLowerCase();
    return token.startsWith(".")
      ? file.name.toLowerCase().endsWith(token)
      : token.endsWith("/*")
        ? file.type.startsWith(token.slice(0, -1))
        : token === file.type.toLowerCase();
  });
}

async function select(file?: File): Promise<void> {
  if (!file || locked.value) return;
  cancel();
  error.value = "";
  failedFile.value = undefined;
  if (!accepts(file)) {
    error.value = "图片格式不支持，请选择允许的图片文件";
    return;
  }
  if (props.maxSize && file.size > props.maxSize) {
    error.value = `图片不能超过 ${Math.round((props.maxSize / 1024 / 1024) * 10) / 10} MB`;
    return;
  }
  const current = generation;
  const request = new AbortController();
  controller = request;
  busy.value = true;
  emit("busy-change", true);
  try {
    const result = await props.upload(file, {
      signal: request.signal,
      onProgress: (percent) => {
        if (current === generation && Number.isFinite(percent))
          progress.value = Math.max(0, Math.min(100, Math.round(percent)));
      },
    });
    if (request.signal.aborted || current !== generation || locked.value)
      return;
    const url = typeof result === "string" ? result : result.url;
    // The application may use an owned blob URL for a local-only preview.
    // Executable and protocol-relative URLs are never accepted.
    if (
      !url ||
      /[\u0000-\u001f]/.test(url) ||
      !/^(https?:\/\/|blob:|\/(?!\/))/.test(url)
    )
      throw new Error("上传服务未返回有效的图片地址");
    // End pending validation before publishing the value to a parent form.
    controller = undefined;
    busy.value = false;
    progress.value = undefined;
    previewFailed.value = false;
    emit("busy-change", false);
    emit("update:modelValue", url);
    emit("uploaded", url);
  } catch (caught) {
    if (request.signal.aborted || current !== generation) return;
    const failure =
      caught instanceof Error ? caught : new Error("上传失败，请重试");
    error.value = failure.message;
    failedFile.value = file;
    emit("error", failure);
  } finally {
    if (current === generation && busy.value) {
      controller = undefined;
      busy.value = false;
      progress.value = undefined;
      emit("busy-change", false);
    }
  }
}
function picked(event: Event): void {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = "";
  void select(file);
}
function dropped(event: DragEvent): void {
  dragging.value = false;
  if (locked.value || busy.value) return;
  if ((event.dataTransfer?.files.length ?? 0) > 1) {
    error.value = "每次请选择一张图片";
    return;
  }
  void select(event.dataTransfer?.files[0]);
}
function remove(): void {
  cancel();
  error.value = "";
  failedFile.value = undefined;
  emit("update:modelValue", "");
}
// A reset, another record, or a disabled field must invalidate late responses.
watch(
  () => props.modelValue,
  () => {
    cancel();
    previewFailed.value = false;
    error.value = "";
  },
);
watch(locked, (value) => {
  if (value) cancel();
});
onBeforeUnmount(cancel);
</script>

<template>
  <div
    v-bind="$attrs"
    class="min-w-0 space-y-2"
    :aria-busy="busy"
    data-slot="image-upload"
  >
    <div
      class="flex min-w-0 flex-wrap items-center gap-3 rounded-lg border border-dashed p-3 transition-colors"
      :class="[
        dragging && !locked
          ? 'border-primary bg-accent'
          : 'border-border bg-muted/20',
        locked && 'opacity-60',
      ]"
      @dragover.prevent="dragging = !locked && !busy"
      @dragleave.prevent="dragging = false"
      @drop.prevent="dropped"
    >
      <div
        v-if="modelValue"
        class="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted"
      >
        <img
          v-if="!previewFailed"
          :src="modelValue"
          alt="当前图片"
          class="size-full object-contain"
          @error="previewFailed = true"
        />
        <span v-else class="px-2 text-center text-xs text-muted-foreground"
          >暂时无法预览</span
        >
      </div>
      <div class="min-w-0 flex-1 space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <Button
            :id="id"
            size="sm"
            variant="outline"
            icon="lucide:upload"
            :disabled="locked || busy"
            @click="input?.click()"
            @blur="emit('blur', $event)"
            >{{ busy ? "正在上传…" : modelValue ? "替换图片" : label }}</Button
          >
          <Button v-if="busy" size="sm" variant="ghost" @click="cancel"
            >取消上传</Button
          >
          <Button
            v-if="modelValue && !busy && !locked"
            size="sm"
            variant="ghost"
            icon="lucide:x"
            @click="remove"
            >移除</Button
          >
          <slot name="actions" :disabled="locked || busy" />
        </div>
        <p class="text-xs text-muted-foreground">
          {{ hint || "点击上传或将图片拖到此处" }}
        </p>
        <p v-if="busy" role="status" class="text-xs text-muted-foreground">
          {{
            progress === undefined
              ? "上传完成后自动回填图片"
              : `已上传 ${progress}%`
          }}
        </p>
      </div>
    </div>
    <input
      ref="input"
      type="file"
      class="hidden"
      :accept="accept"
      :disabled="locked || busy"
      tabindex="-1"
      aria-label="选择图片文件"
      @change="picked"
    />
    <div
      v-if="error"
      role="alert"
      class="flex items-center gap-2 text-sm text-destructive"
    >
      <span>{{ error }}</span
      ><Button
        v-if="failedFile && !locked"
        variant="ghost"
        size="sm"
        @click="select(failedFile)"
        >重试上传</Button
      >
    </div>
  </div>
</template>
