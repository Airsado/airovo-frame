<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { computed, ref, useAttrs } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'
import { Button, Input } from '@airovo/uikit-shadcnui'

defineOptions({ name: 'PasswordInput', inheritAttrs: false })

const props = withDefaults(defineProps<{
    modelValue?: string | number
    defaultValue?: string | number
    disabled?: boolean
    class?: HTMLAttributes['class']
    /** Optional class for the native input. `class` remains the wrapper class. */
    inputClass?: HTMLAttributes['class']
    /** Accessible name for the visibility toggle. */
    toggleAriaLabel?: string
}>(), {
    modelValue: undefined,
    defaultValue: undefined,
    disabled: false,
    inputClass: undefined,
    toggleAriaLabel: 'Toggle password visibility',
})

const emit = defineEmits<{
    (event: 'update:modelValue', value: string | number): void
}>()

const attrs = useAttrs()
const visible = ref(false)

const modelValue = computed({
    get: () => props.modelValue ?? props.defaultValue ?? '',
    set: (value: string | number) => emit('update:modelValue', value),
})

/**
 * The new-api component owns the input type.  Filter a caller-provided type
 * so a schema's stale `type="password"` cannot override the visibility state.
 * Other native attributes and listeners continue to target the real input.
 */
const inputAttrs = computed(() => {
    const { class: _class, type: _type, disabled: _disabled, ...rest } = attrs
    return rest
})

const inputType = computed(() => visible.value ? 'text' : 'password')

function toggleVisibility(): void {
    if (props.disabled) return
    visible.value = !visible.value
}
</script>

<template>
    <div :class="['relative rounded-md', props.class]">
        <Input
            v-bind="inputAttrs"
            v-model="modelValue"
            :default-value="props.defaultValue"
            :type="inputType"
            :disabled="props.disabled"
            :class="props.inputClass"
        />
        <Button
            type="button"
            size="icon"
            variant="ghost"
            :disabled="props.disabled"
            :aria-label="props.toggleAriaLabel"
            class="text-muted-foreground absolute end-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-md"
            @click="toggleVisibility"
        >
            <Eye v-if="visible" :size="18" aria-hidden="true" />
            <EyeOff v-else :size="18" aria-hidden="true" />
        </Button>
    </div>
</template>
