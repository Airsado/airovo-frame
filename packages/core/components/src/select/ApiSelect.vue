<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { LoaderCircle } from "@lucide/vue";
import { Button } from "../controls";
import Combobox from "./Combobox.vue";
import { selectableSelectOptions, type SelectOption } from "./options";
import type { ApiSelectLoader, ApiSelectResolver } from "./api-select";

defineOptions({ name: "ApiSelect", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    api: ApiSelectLoader;
    resolveSelected?: ApiSelectResolver;
    remote?: boolean;
    debounce?: number;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    loadingText?: string;
    errorText?: string;
    retryText?: string;
    disabled?: boolean;
    showSelectedIcon?: boolean;
    openOnFocus?: boolean;
    popupClass?: string;
    id?: string;
    name?: string;
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
    ariaInvalid?: boolean | string;
    class?: string;
  }>(),
  { remote: false, debounce: 250, disabled: false },
);

const emit = defineEmits<{ "load-error": [error: unknown] }>();
const modelValue = defineModel<string | undefined>();
const { t, te } = useI18n({ useScope: "global" });
function copy(key: string, fallback: string): string {
  return te(key) ? t(key) : fallback;
}
const resolvedPlaceholder = computed(
  () => props.placeholder ?? copy("common.selectPlaceholder", "请选择"),
);
const resolvedEmptyText = computed(
  () => props.emptyText ?? copy("common.selectEmpty", "没有匹配的选项"),
);
const resolvedLoadingText = computed(
  () => props.loadingText ?? copy("common.loading", "加载中…"),
);
const resolvedErrorText = computed(
  () => props.errorText ?? copy("common.loadError", "选项加载失败"),
);
const resolvedRetryText = computed(
  () => props.retryText ?? copy("common.retry", "重试"),
);

const options = ref<SelectOption[]>([]);
const selected = ref<SelectOption>();
const loading = ref(false);
const failed = ref(false);
const open = ref(false);
const search = ref("");
const page = ref(1);
const hasMore = ref(false);
const hint = ref("");
const loadingMore = ref(false);
const moreFailed = ref(false);
const resolveFailed = ref(false);
let controller: AbortController | undefined;
let selectedController: AbortController | undefined;
let selectedRevision = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let revision = 0;
let disposed = false;

// A label from an earlier search remains available without adding that option
// to a later, unrelated result list or changing the selected ID.
const selectedLabel = computed(() =>
  selected.value && selected.value.value === modelValue.value
    ? selected.value.label
    : undefined,
);
const visibleOptions = computed(() =>
  loading.value || failed.value ? [] : options.value,
);

function cancel(): void {
  revision += 1;
  controller?.abort();
  controller = undefined;
  clearTimeout(timer);
  timer = undefined;
  loading.value = false;
  loadingMore.value = false;
}

function rememberSelected(): void {
  const current = selectableSelectOptions(options.value).find(
    (option) => option.value === modelValue.value,
  );
  if (current) selected.value = current;
  else if (selected.value?.value !== modelValue.value)
    selected.value = undefined;
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
      signal: requestController.signal,
      page: nextPage,
    });
    if (
      disposed ||
      requestController.signal.aborted ||
      requestRevision !== revision
    )
      return;
    const rows = Array.isArray(result) ? result : result.options;
    const merged = append ? [...options.value, ...rows] : rows;
    options.value = merged.filter(
      (row, index) =>
        row.value === undefined ||
        merged.findIndex((item) => item.value === row.value) === index,
    );
    page.value = nextPage;
    hasMore.value = !Array.isArray(result) && result.hasMore;
    hint.value = Array.isArray(result) ? "" : result.hint ?? "";
    rememberSelected();
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
  search.value = "";
  if (value) void load("");
  else cancel();
}

function onSearch(value: string): void {
  search.value = value;
  if (!props.remote || !open.value) return;
  // Invalidate immediately, including APIs that do not honor AbortSignal.
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

async function resolveSelection(): Promise<void> {
  selectedRevision += 1;
  selectedController?.abort();
  selectedController = undefined;
  resolveFailed.value = false;
  const value = modelValue.value;
  if (!value || props.disabled || selected.value?.value === value || disposed)
    return;
  if (!props.resolveSelected) {
    if (!loading.value) await load("");
    return;
  }
  const requestRevision = selectedRevision;
  const requestController = new AbortController();
  selectedController = requestController;
  try {
    const option = await props.resolveSelected(value, {
      signal: requestController.signal,
    });
    if (
      disposed ||
      requestController.signal.aborted ||
      requestRevision !== selectedRevision ||
      value !== modelValue.value
    )
      return;
    if (!option || option.value !== value) resolveFailed.value = true;
    else selected.value = option;
  } catch (error) {
    if (
      disposed ||
      requestController.signal.aborted ||
      requestRevision !== selectedRevision
    )
      return;
    resolveFailed.value = true;
    emit("load-error", error);
  }
}

watch(
  modelValue,
  (value) => {
    rememberSelected();
    void resolveSelection();
  },
  { immediate: true },
);

watch(
  () => props.api,
  () => {
    cancel();
    options.value = [];
    selected.value = undefined;
    if (open.value) void reload();
    void resolveSelection();
  },
);

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) {
      cancel();
      selectedRevision += 1;
      selectedController?.abort();
    } else {
      if (open.value) void reload();
      void resolveSelection();
    }
  },
);

onBeforeUnmount(() => {
  disposed = true;
  cancel();
  selectedRevision += 1;
  selectedController?.abort();
});
defineExpose({ reload });
</script>

<template>
  <Combobox
    v-model="modelValue"
    v-bind="$attrs"
    :options="visibleOptions"
    :filter-options="!props.remote"
    :allow-custom-value="false"
    :selected-label="selectedLabel"
    :placeholder="resolvedPlaceholder"
    :search-placeholder="props.searchPlaceholder"
    :empty-text="resolvedEmptyText"
    :disabled="props.disabled"
    :show-selected-icon="props.showSelectedIcon"
    :open-on-focus="props.openOnFocus"
    :popup-class="props.popupClass"
    :id="props.id"
    :name="props.name"
    :aria-label="props.ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    :aria-describedby="props.ariaDescribedby"
    :aria-invalid="props.ariaInvalid"
    :aria-busy="loading || loadingMore"
    :class="props.class"
    @open-change="onOpenChange"
    @search="onSearch"
  >
    <template #footer>
      <div
        v-if="hasMore || hint || moreFailed"
        class="border-t p-2 text-center text-xs text-muted-foreground"
      >
        <p v-if="hint" class="mb-1">{{ hint }}</p>
        <p v-if="moreFailed" role="alert">{{ resolvedErrorText }}</p>
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
              ? resolvedLoadingText
              : moreFailed
                ? resolvedRetryText
                : copy("common.loadMore", "加载更多")
          }}
        </Button>
      </div>
    </template>
    <template #empty>
      <span v-if="loading" role="status" class="inline-flex items-center gap-2"
        ><LoaderCircle class="size-4 animate-spin" aria-hidden="true" />{{
          resolvedLoadingText
        }}</span
      >
      <div
        v-else-if="failed"
        role="alert"
        class="flex flex-col items-center gap-2"
      >
        <span>{{ resolvedErrorText }}</span>
        <Button type="button" size="sm" variant="outline" @click="reload">{{
          resolvedRetryText
        }}</Button>
      </div>
      <span v-else>{{ resolvedEmptyText }}</span>
    </template>
  </Combobox>
  <div
    v-if="resolveFailed && !props.disabled"
    role="alert"
    class="mt-1 flex items-center gap-1 text-xs text-muted-foreground"
  >
    <span>{{
      copy("common.selectedOptionLoadError", "所选项名称未能加载")
    }}</span>
    <Button
      type="button"
      size="sm"
      variant="link"
      class="h-auto p-0 text-xs"
      @click="resolveSelection"
      >{{ resolvedRetryText }}</Button
    >
  </div>
</template>
