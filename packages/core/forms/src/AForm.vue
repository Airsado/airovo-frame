<script setup lang="ts">
/**
 * AForm — v5-aligned schema-driven form.
 *
 * Reads a `FormApi` instance created by `useAForm()` and renders the
 * schema field-by-field. Uses the v5 inline show/disabled/defaultValue
 * functions (no separate `dependencies` array). Per-field error
 * rendering lives in `FormFieldRender.vue`.
 */
import { computed, ref } from 'vue'
import type { FormComponentMap, FormFieldSchema } from './types'
import { FormApi } from './form-api'
import FormFieldRender from './FormFieldRender.vue'

// ── Props ──

const props = withDefaults(
    defineProps<{
        api: FormApi
        componentMap?: FormComponentMap
        wrapperClass?: string
        /** Default column props for all fields (per-field `colProps` overrides). */
        baseColProps?: { span?: number }
        collapsible?: boolean
        collapsedRows?: number
        collapsed?: boolean
        showDefaultActions?: boolean
        submitButtonText?: string
        resetButtonText?: string
    }>(),
    {
        wrapperClass: 'grid-cols-1',
        baseColProps: () => ({ span: 24 }),
        collapsedRows: 1,
        showDefaultActions: true,
        submitButtonText: '提交',
        resetButtonText: '重置',
    },
)

const emit = defineEmits<{ 'update:collapsed': [value: boolean] }>()

// ── Collapsible ──

const isCollapsed = ref(props.collapsed ?? true)
const visibleSchema = computed(() => {
    if (!props.collapsible) return props.api.schema
    const rows = props.collapsedRows ?? 1
    return isCollapsed.value && props.api.schema.length > rows
        ? props.api.schema.slice(0, rows)
        : props.api.schema
})
const canToggle = computed(
    () => props.collapsible && props.api.schema.length > (props.collapsedRows ?? 1),
)

// ── Per-field show / disabled evaluation (v5 inline functions) ──
//
// Each field may declare `show` / `disabled` as either a static
// boolean or a function receiving the current form context. We
// evaluate them against the form's current values + api.

const currentValues = computed(() => {
    // `form.values` is the vee-validate values ref. When undefined
    // (before mount), fall back to {}.
    return (props.api.form?.values?.value ?? props.api.form?.values) ?? {}
})

function isFieldVisible(field: FormFieldSchema): boolean {
    if (typeof field.show === 'function') {
        return !!field.show({ values: currentValues.value, api: props.api })
    }
    if (typeof field.show === 'boolean') return field.show
    return true
}

function isFieldDisabled(field: FormFieldSchema): boolean {
    if (typeof field.disabled === 'function') {
        return !!field.disabled({ values: currentValues.value, api: props.api })
    }
    if (typeof field.disabled === 'boolean') return field.disabled
    return false
}

function resolveComponentProps(field: FormFieldSchema): Record<string, any> {
    if (typeof field.componentProps === 'function') {
        return field.componentProps({ values: currentValues.value, api: props.api }) ?? {}
    }
    return field.componentProps ?? {}
}

const visibleFields = computed(() =>
    props.api.schema.filter((f) => isFieldVisible(f)),
)

// ── Per-field grid column class (v5 colProps) ──

function colClassFor(field: FormFieldSchema): string {
    const span = field.colProps?.span ?? props.baseColProps.span ?? 24
    return `col-span-12 md:col-span-${span}`
}

// ── Handlers ──

async function handleSubmit(e: Event) {
    // submitForm scrolls to the first errored field on failure.
    await props.api.submitForm(e)
}
async function handleReset() { await props.api.resetForm() }
</script>

<template>
    <form class="space-y-4" @submit="handleSubmit">
        <div :class="['grid gap-4', wrapperClass]">
            <template v-for="field in visibleSchema" :key="field.fieldName">
                <div
                    v-if="isFieldVisible(field)"
                    :class="colClassFor(field)"
                >
                    <FormFieldRender
                        :field="field"
                        :api="api"
                        :component-map="componentMap ?? {}"
                        :current-values="currentValues"
                        :disabled="isFieldDisabled(field)"
                        :resolved-component-props="resolveComponentProps(field)"
                    />
                </div>
            </template>
        </div>

        <div v-if="canToggle" class="flex justify-center">
            <button
                type="button"
                class="text-sm text-muted-foreground hover:text-foreground"
                @click="isCollapsed = !isCollapsed; emit('update:collapsed', isCollapsed)"
            >
                展开/收起
            </button>
        </div>

        <div v-if="showDefaultActions" class="flex items-center justify-end gap-2 pt-2">
            <button
                type="button"
                class="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                @click="handleReset"
            >{{ resetButtonText }}</button>
            <button
                type="submit"
                class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >{{ submitButtonText }}</button>
        </div>

        <slot name="actions" />
    </form>
</template>
