<script setup lang="ts">
import { X } from '@lucide/vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@airovo/uikit-shadcnui/components/ui/select'
import { useAttrs } from 'vue'

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  options?: SelectOption[]
  placeholder?: string
  allowClear?: boolean
  disabled?: boolean
  class?: string
}>(), {
  options: () => [],
  placeholder: '请选择',
  allowClear: false,
  disabled: false,
})

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

const modelValue = defineModel<string | undefined>()

function clear(event: MouseEvent): void {
  event.preventDefault()
  event.stopPropagation()
  modelValue.value = undefined
}
</script>

<template>
  <Select v-model="modelValue" :disabled="props.disabled">
    <div class="relative w-full">
      <SelectTrigger
        v-bind="attrs"
        :class="['w-full', props.class, props.allowClear && modelValue ? 'pr-14' : undefined]"
      >
        <SelectValue :placeholder="props.placeholder" />
      </SelectTrigger>
      <button
        v-if="props.allowClear && modelValue"
        type="button"
        class="absolute right-7 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm opacity-50 transition-opacity hover:opacity-100"
        aria-label="清除选择"
        @click="clear"
      >
        <X class="size-3.5" />
      </button>
    </div>
    <SelectContent>
      <SelectItem
        v-for="option in props.options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
