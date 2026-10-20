<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { LoaderCircle } from "@lucide/vue";
import { Button } from "../controls";
import MultiSelect, { type MultiSelectOption } from "./MultiSelect.vue";
import { selectableSelectOptions } from "./options";
import type { ApiSelectLoader } from "./api-select";

defineOptions({ name: "ApiMultiSelect", inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    api: ApiSelectLoader;
    modelValue?: string[];
    remote?: boolean;
    debounce?: number;
    disabled?: boolean;
    allowCreate?: boolean;
    placeholder?: string;
    createLabel?: string;
    emptyText?: string;
    loadingText?: string;
    errorText?: string;
    retryText?: string;
    hint?: string;
    maxVisibleChips?: number;
    copyChipOnClick?: boolean;
  }>(),
  {
    modelValue: () => [],
    remote: false,
    debounce: 250,
    disabled: false,
    allowCreate: false,
  },
);
const emit = defineEmits<{
  "update:modelValue": [value: string[]];
  "load-error": [error: unknown];
  "open-change": [open: boolean];
}>();
const { t, te } = useI18n({ useScope: "global" });
function copy(key: string, fallback: string): string {
  return te(key) ? t(key) : fallback;
}
const loadingCopy = computed(
  () => props.loadingText ?? copy("common.loading", "加载中…"),
);
const errorCopy = computed(
  () => props.errorText ?? copy("common.loadError", "选项加载失败"),
);
const retryCopy = computed(
  () => props.retryText ?? copy("common.retry", "重试"),
);
const options = ref<MultiSelectOption[]>([]);
const labels = ref(new Map<string, MultiSelectOption>());
const selectedOptions = computed(() =>
  props.modelValue.flatMap((value) =>
    labels.value.has(value) ? [labels.value.get(value)!] : [],
  ),
);
const loading = ref(false);
const loadingMore = ref(false);
const failed = ref(false);
const moreFailed = ref(false);
const open = ref(false);
const search = ref("");
const page = ref(0);
const hasMore = ref(false);
const loadedHint = ref("");
const multiSelect = ref<InstanceType<typeof MultiSelect>>();
let controller: AbortController | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let revision = 0;
let disposed = false;

function cancel(): void {
  revision += 1;
  controller?.abort();
  controller = undefined;
  clearTimeout(timer);
  timer = undefined;
  loading.value = false;
  loadingMore.value = false;
}
async function load(term: string, append = false): Promise<void> {
  cancel();
  if (props.disabled || disposed) return;
  const requestRevision = revision;
  const requestController = new AbortController();
  controller = requestController;
  const nextPage = append ? page.value + 1 : 1;
  loading.value = !append;
  loadingMore.value = append;
  failed.value = false;
  moreFailed.value = false;
  try {
    const result = await props.api({
      search: term,
      page: nextPage,
      signal: requestController.signal,
    });
    if (
      disposed ||
      requestController.signal.aborted ||
      requestRevision !== revision
    )
      return;
    const rows = selectableSelectOptions(
      Array.isArray(result) ? result : result.options,
    )
      .filter((row) => typeof row.value === "string" && row.value.length > 0)
      .map((row) => ({
        label: row.label,
        value: row.value!,
        hint: row.description,
        icon: row.icon,
        disabled: row.disabled,
      }));
    const merged = append ? [...options.value, ...rows] : rows;
    options.value = merged.filter(
      (row, index) =>
        merged.findIndex((item) => item.value === row.value) === index,
    );
    for (const row of rows) labels.value.set(row.value, row);
    // Keep only selected labels and the current result set, avoiding an unbounded search cache.
    const retained = new Set([
      ...props.modelValue,
      ...options.value.map((row) => row.value),
    ]);
    labels.value = new Map(
      [...labels.value].filter(([value]) => retained.has(value)),
    );
    page.value = nextPage;
    hasMore.value = !Array.isArray(result) && result.hasMore;
    loadedHint.value = Array.isArray(result) ? "" : result.hint ?? "";
  } catch (error) {
    if (
      disposed ||
      requestController.signal.aborted ||
      requestRevision !== revision
    )
      return;
    if (append) moreFailed.value = true;
    else failed.value = true;
    emit("load-error", error);
  } finally {
    if (!disposed && requestRevision === revision) {
      loading.value = false;
      loadingMore.value = false;
      controller = undefined;
    }
  }
}
function onOpenChange(value: boolean): void {
  open.value = value;
  emit("open-change", value);
  if (value) void load(props.remote ? search.value : "");
  else cancel();
}
function onSearch(value: string): void {
  search.value = value;
  if (!props.remote || !open.value) return;
  cancel();
  failed.value = false;
  loading.value = true;
  timer = setTimeout(
    () => {
      void load(value);
    },
    Math.max(0, props.debounce),
  );
}
function reload(): Promise<void> {
  return load(props.remote ? search.value : "");
}
function reset(): void {
  cancel();
  options.value = [];
  labels.value = new Map();
  page.value = 0;
  hasMore.value = false;
  loadedHint.value = "";
  failed.value = false;
  moreFailed.value = false;
}
watch(
  () => props.api,
  () => {
    reset();
    if (open.value) void reload();
  },
);
watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) cancel();
  },
);
onBeforeUnmount(() => {
  disposed = true;
  cancel();
});
defineExpose({
  reload,
  focus: () => multiSelect.value?.focus(),
  blur: () => multiSelect.value?.blur(),
});
</script>

<template>
  <MultiSelect
    ref="multiSelect"
    v-bind="$attrs"
    :model-value="props.modelValue"
    :options="loading || failed ? [] : options"
    :selected-options="selectedOptions"
    :filter-options="!props.remote"
    :disabled="props.disabled"
    :allow-create="props.allowCreate"
    :placeholder="props.placeholder"
    :create-label="props.createLabel"
    :empty-text="props.emptyText"
    :show-empty="!loading && !failed"
    :max-visible-chips="props.maxVisibleChips"
    :copy-chip-on-click="props.copyChipOnClick"
    :aria-busy="loading || loadingMore"
    @update:model-value="emit('update:modelValue', $event)"
    @open-change="onOpenChange"
    @search="onSearch"
  >
    <template #selected-summary="slotProps" v-if="$slots['selected-summary']"
      ><slot name="selected-summary" v-bind="slotProps"
    /></template>
    <template #header>
      <div
        v-if="loading"
        role="status"
        class="flex items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground"
      >
        <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />{{
          loadingCopy
        }}
      </div>
      <div
        v-else-if="failed"
        role="alert"
        class="flex items-center justify-between gap-2 px-3 py-3 text-sm text-muted-foreground"
      >
        <span>{{ errorCopy }}</span>
        <Button type="button" size="sm" variant="outline" @click="reload">{{
          retryCopy
        }}</Button>
      </div>
    </template>
    <template #footer>
      <div
        v-if="hasMore || loadedHint || props.hint || moreFailed"
        class="border-t p-2 text-center text-xs text-muted-foreground"
      >
        <p v-if="loadedHint || props.hint" class="px-1 py-1 text-left">
          {{ loadedHint || props.hint }}
        </p>
        <p v-if="moreFailed" role="alert">{{ errorCopy }}</p>
        <Button
          v-if="hasMore || moreFailed"
          type="button"
          size="sm"
          variant="ghost"
          class="w-full"
          :disabled="loading || loadingMore"
          @click="load(props.remote ? search : '', true)"
        >
          <LoaderCircle
            v-if="loadingMore"
            class="size-4 animate-spin"
            aria-hidden="true"
          />
          {{
            loadingMore
              ? loadingCopy
              : moreFailed
                ? retryCopy
                : copy("common.loadMore", "加载更多")
          }}
        </Button>
      </div>
    </template>
  </MultiSelect>
</template>
