<script setup lang="ts">
import { X } from '@lucide/vue'
import { useOverlayOwner } from '@airovo/shared/overlay'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@airovo/uikit-shadcnui/components/ui/select'
import { computed, ref, useAttrs, watch } from 'vue'
import { flattenSelectOptions, type SelectOption } from './options'

export type { SelectOption } from './options'

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
const owner = useOverlayOwner()
const open = ref(false)
const popupStyle = computed(() => owner?.popupZIndex.value === undefined
  ? undefined
  : { zIndex: owner.popupZIndex.value })
const flattenedOptions = computed(() => flattenSelectOptions(props.options))

// Watch the owning main layer rather than raising a popup above every overlay.
// Reka remains responsible for focus scopes, Escape, outside and body locking.
watch(() => owner?.active.value, (active) => {
  if (active === false) open.value = false
}, { flush: 'sync' })

function updateOpen(value: boolean): void {
  open.value = value && owner?.active.value !== false
}

function onCloseAutoFocus(event: Event): void {
  // Owner closure/coverage must not refocus a hidden trigger over the new host.
  if (owner?.active.value === false) event.preventDefault()
}

const modelValue = defineModel<string | undefined>()

function clear(event: MouseEvent): void {
  event.preventDefault()
  event.stopPropagation()
  if (props.disabled) return
  modelValue.value = undefined
}
</script>

<template>
  <Select v-model="modelValue" :open="open" :disabled="props.disabled" @update:open="updateOpen">
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
        :disabled="props.disabled"
        @click="clear"
      >
        <X class="size-3.5" />
      </button>
    </div>
    <SelectContent :style="popupStyle" @close-auto-focus="onCloseAutoFocus">
      <SelectGroup>
        <template v-for="item in flattenedOptions" :key="item.key">
          <SelectLabel v-if="item.group" class="font-semibold" :style="{ paddingLeft: `${0.5 + item.depth * 0.75}rem` }">
            {{ item.option.label }}
          </SelectLabel>
          <SelectItem v-else-if="item.option.value !== undefined" :value="item.option.value" :disabled="item.option.disabled" :style="{ paddingLeft: `${0.5 + item.depth * 0.75}rem` }">
            {{ item.option.label }}
          </SelectItem>
        </template>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
