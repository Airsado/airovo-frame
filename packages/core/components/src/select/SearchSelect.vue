<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Combobox from './Combobox.vue'
import type { SelectOption } from './options'

defineOptions({ name: 'SearchSelect' })

const props = withDefaults(defineProps<{
  options?: SelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  class?: string
}>(), {
  options: () => [],
  disabled: false,
})

const { t, te } = useI18n({ useScope: 'global' })
function copy(key: string, fallback: string): string { return te(key) ? t(key) : fallback }
const resolvedPlaceholder = computed(() => props.placeholder ?? copy('common.selectPlaceholder', '请选择'))
const resolvedSearchPlaceholder = computed(() => props.searchPlaceholder ?? copy('common.selectSearch', '搜索选项'))
const resolvedEmptyText = computed(() => props.emptyText ?? copy('common.selectEmpty', '没有匹配的选项'))
const modelValue = defineModel<string | undefined>()
</script>

<template>
  <Combobox
    v-model="modelValue"
    :options="props.options"
    :placeholder="resolvedPlaceholder"
    :search-placeholder="resolvedSearchPlaceholder"
    :empty-text="resolvedEmptyText"
    :disabled="props.disabled"
    :class="props.class"
  />
</template>
