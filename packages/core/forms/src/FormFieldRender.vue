<script setup lang="ts">
/**
 * FormFieldRender — single-field row (label + input + error).
 *
 * Driven by the parent `<AForm>`. Receives the resolved props
 * (already evaluated by AForm's `show` / `disabled` / function
 * `componentProps`) plus the live form values + the FormApi for
 * the `useField()` bridge.
 */
import { computed } from 'vue'
import { Input } from '@airovo/uikit-shadcnui'
import { useField } from 'vee-validate'
import type { FormComponentMap, FormFieldSchema } from './types'
import type { FormApi } from './form-api'

defineOptions({ name: 'FormFieldRender' })

const props = defineProps<{
    field: FormFieldSchema
    api: FormApi
    componentMap: FormComponentMap
    /** Current form values (passed from AForm; reactive). */
    currentValues: Record<string, any>
    /** Disabled state, already evaluated by AForm. */
    disabled: boolean
    /** Resolved component props (may include dynamic show/disabled outputs). */
    resolvedComponentProps: Record<string, any>
}>()

const field = props.field as any

// Field-level zod rule (optional). When omitted, useField does no
// per-field validation — the form-level zod schema (mounted on the
// FormApi) is the source of truth.
const rule = field.rules
    ? (val: any) => {
          const r = field.rules.safeParse(val === '' ? undefined : val)
          return r.success ? true : r.error.issues[0]?.message ?? '格式不正确'
      }
    : undefined

// vee-validate v4 removed `validateOnBlur` from FieldOptions. We
// disable input-driven validation and rely on the explicit
// `handleBlur` returned by useField, attached to the rendered
// element via @blur in the template.
const { value, errorMessage, handleChange, handleBlur } = useField(
    () => field.fieldName,
    rule,
)

// Form-level zod errors live on `props.api.errors`. v4 exposes
// `errors` as a reactive Ref (we wrap a fresh Ref inside the
// FormApi's mount()).
const formError = computed(() => {
    const errs = props.api.errors?.value ?? props.api.errors
    return errs?.[field.fieldName] ?? ''
})

// Combined display: form-level zod errors win (they fire on submit
// and apply to the whole schema); per-field `field.rules` still
// surface early while the user is typing.
const displayError = computed(() => formError.value || errorMessage.value)
const hasError = computed(() => Boolean(displayError.value))
const describedById = computed(() => (hasError.value ? `${field.fieldName}-error` : undefined))

// The component to render. Falls back to Input. Component props are
// merged: static field.componentProps ⊕ the resolved (dynamic) props
// from AForm (which may include a show/disabled override of props).
const ResolvedComp = computed<any>(
    () => props.componentMap[field.component] ?? props.componentMap.Input ?? Input,
)

const mergedProps = computed(() => ({
    ...(field.componentProps || {}),
    ...(props.resolvedComponentProps || {}),
}))

const inputType = computed(() => {
    switch (field.component) {
        case 'Number': return 'number'
        case 'Email': return 'email'
        case 'Password': return 'password'
        default: return 'text'
    }
})

function onUpdate(v: any) {
    handleChange(v)
    props.api.setFieldValue(field.fieldName, v)
}
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
                v-if="field.required"
                class="ml-0.5 text-destructive"
            >*</span>
        </label>

        <component
            :is="ResolvedComp"
            :id="field.fieldName"
            :name="field.fieldName"
            :type="inputType"
            :modelValue="value ?? field.defaultValue ?? ''"
            :placeholder="mergedProps.placeholder ?? '请输入'"
            :disabled="disabled"
            :aria-invalid="hasError || undefined"
            :aria-describedby="describedById"
            v-bind="mergedProps"
            @update:modelValue="onUpdate"
            @blur="handleBlur"
        />

        <p
            v-if="field.description"
            class="text-muted-foreground text-xs mt-1"
        >{{ field.description }}</p>

        <p
            v-if="hasError"
            :id="`${field.fieldName}-error`"
            class="text-destructive text-sm mt-1.5"
        >{{ displayError }}</p>
    </div>
</template>
