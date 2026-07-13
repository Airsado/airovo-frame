<script setup lang="ts">
/**
 * AForm — auto-renders a form from a JSON-style schema, backed by
 * vee-validate + zod. The heavy lifting of one-field rendering lives
 * in `FormFieldRender.vue` (extracted to avoid a second <script> block
 * that was breaking vue-tsc).
 */
import { computed, ref, watch } from 'vue'
import type { FormComponentMap, FormFieldDependencies, FormFieldSchema } from './types'
import { FormApi } from './form-api'
import FormFieldRender from './FormFieldRender.vue'

// ── Props ──

const props = withDefaults(
    defineProps<{
        api: FormApi
        componentMap?: FormComponentMap
        wrapperClass?: string
        collapsible?: boolean
        collapsedRows?: number
        collapsed?: boolean
        showDefaultActions?: boolean
        submitButtonText?: string
        resetButtonText?: string
    }>(),
    {
        wrapperClass: 'grid-cols-1',
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

// ── Dependencies ──

const depValues = ref<Record<string, any>>({})
function evalDeps(deps: FormFieldDependencies | undefined): Record<string, any> {
    if (!deps) return {}
    const v = depValues.value
    return {
        hidden: deps.hidden?.(v, props.api),
        disabled: deps.disabled?.(v, props.api),
        required: deps.required?.(v, props.api),
        componentProps: deps.componentProps?.(v, props.api),
    }
}
watch(
    () => {
        if (!props.api.form) return {}
        const vals: Record<string, any> = {}
        for (const f of props.api.schema) {
            for (const t of f.dependencies?.triggerFields ?? []) {
                vals[t] = props.api.form.values?.[t]
            }
        }
        return vals
    },
    (v) => { depValues.value = v ?? {} },
    { immediate: true, deep: true },
)

// ── Handlers ──

async function handleSubmit(e: Event) { await props.api.submitForm(e) }
async function handleReset() { await props.api.resetForm() }
</script>

<template>
    <form class="space-y-4" @submit="handleSubmit">
        <div :class="['grid gap-4', wrapperClass]">
            <template v-for="field in visibleSchema" :key="field.fieldName">
                <FormFieldRender
                    v-if="!evalDeps(field.dependencies).hidden && !field.hidden"
                    :field="field"
                    :api="api"
                    :component-map="componentMap ?? {}"
                    :deps="evalDeps(field.dependencies)"
                />
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
