<script setup lang="ts">
/**
 * FormFieldRender — renders a single field row (label + input + error).
 *
 * Extracted from AForm.vue so the parent template stays clean and so we
 * sidestep the "two <script> blocks" issue that broke vue-tsc.
 *
 * Renders the component resolved from `componentMap` (defaults to
 * shadcn-vue Input). The resolved component is typed as `any` so that
 * HTML attributes (`id`, `onBlur`) and the `onUpdate:modelValue` event
 * — which the shadcn-vue Input/Textarea do not declare in their
 * TypeScript interfaces — can be forwarded via attribute fallthrough.
 */
import { computed } from 'vue'
import { Input } from '@airovo/uikit-shadcnui'
import { useField } from 'vee-validate'
import type { FormComponentMap, FormFieldSchema } from './types'

defineOptions({ name: 'FormFieldRender' })

const props = defineProps<{
    field: FormFieldSchema
    api: any
    componentMap: FormComponentMap
    deps?: Record<string, any>
}>()

const field = props.field as any

// Per-field zod rule (overrides the schema-level validation for this field).
const rule = field.rules
    ? (val: any) => {
          const r = field.rules.safeParse(val === '' ? undefined : val)
          return r.success ? true : r.error.issues[0]?.message ?? '格式不正确'
      }
    : undefined

// vee-validate v4 removed `validateOnBlur` from FieldOptions. We disable
// input-driven validation and rely on the explicit `handleBlur` returned
// by useField, attached to the rendered element via @blur in the template.
const { value, errorMessage, handleChange, handleBlur } = useField(
    () => field.fieldName,
    rule,
)

function onUpdate(v: any) {
    handleChange(v)
    props.api.setFieldValue(field.fieldName, v)
}

// Cast to any so the template can bind HTML attributes (id, onBlur) and
// the update:modelValue event that shadcn-vue's Input does not declare.
const ResolvedComp = computed<any>(
    () => props.componentMap[field.component] ?? props.componentMap.Input ?? Input,
)

const inputType = computed(() => {
    switch (field.component) {
        case 'Number': return 'number'
        case 'Email': return 'email'
        case 'Password': return 'password'
        default: return 'text'
    }
})
</script>

<template>
    <div class="space-y-2">
        <label
            v-if="field.label"
            :for="field.fieldName"
            class="text-sm font-medium leading-none"
        >
            {{ field.label }}
            <span
                v-if="field.required || (deps && deps.required)"
                class="ml-0.5 text-destructive"
            >*</span>
        </label>

        <component
            :is="ResolvedComp"
            :id="field.fieldName"
            :name="field.fieldName"
            :type="inputType"
            :modelValue="value ?? field.defaultValue ?? ''"
            :placeholder="field.componentProps?.placeholder ?? '请输入'"
            :disabled="field.disabled || (deps && deps.disabled)"
            v-bind="{ ...(field.componentProps || {}), ...((deps && deps.componentProps) || {}) }"
            @update:modelValue="onUpdate"
            @blur="handleBlur"
        />

        <p
            v-if="field.description"
            class="text-muted-foreground text-xs mt-1"
        >{{ field.description }}</p>

        <p
            v-if="errorMessage"
            class="text-destructive text-sm mt-1.5"
        >{{ errorMessage }}</p>
    </div>
</template>
