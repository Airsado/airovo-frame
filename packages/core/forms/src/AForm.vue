<script setup lang="ts">
import { computed, ref, watch, h, type PropType } from 'vue'
import { Button, Input, Textarea } from '@airovo/uikit-shadcnui'
import { useField } from 'vee-validate'
import type { FormComponentMap, FormFieldSchema, FormFieldDependencies } from './types'
import { FormApi } from './form-api'

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

// ── Component map ──

const DEFAULT_MAP: FormComponentMap = { Input, Password: Input, Number: Input, Email: Input, Textarea }
const mergedMap = computed(() => ({ ...DEFAULT_MAP, ...props.componentMap }))

// ── Collapsible ──

const isCollapsed = ref(props.collapsed ?? true)
const visibleSchema = computed(() => {
    if (!props.collapsible) return props.api.schema
    const rows = props.collapsedRows ?? 1
    return (isCollapsed.value && props.api.schema.length > rows) ? props.api.schema.slice(0, rows) : props.api.schema
})
const canToggle = computed(() => props.collapsible && props.api.schema.length > (props.collapsedRows ?? 1))

// ── Dependencies ──

const depValues = ref<Record<string, any>>({})
function evalDeps(deps: FormFieldDependencies | undefined): Record<string, any> {
    if (!deps) return {}
    const v = depValues.value
    return { hidden: deps.hidden?.(v, props.api), disabled: deps.disabled?.(v, props.api), required: deps.required?.(v, props.api), componentProps: deps.componentProps?.(v, props.api) }
}
watch(() => {
    if (!props.api.form) return {}
    const vals: Record<string, any> = {}
    for (const f of props.api.schema) for (const t of f.dependencies?.triggerFields ?? []) vals[t] = props.api.form.values?.[t]
    return vals
}, v => { depValues.value = v ?? {} }, { immediate: true, deep: true })

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
                    :component-map="mergedMap"
                    :deps="evalDeps(field.dependencies)"
                />
            </template>
        </div>
        <div v-if="canToggle" class="flex justify-center">
            <Button variant="ghost" size="sm" type="button" @click="isCollapsed = !isCollapsed; emit('update:collapsed', isCollapsed)">展开/收起</Button>
        </div>
        <div v-if="showDefaultActions" class="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" type="button" @click="handleReset">{{ resetButtonText }}</Button>
            <Button type="submit">{{ submitButtonText }}</Button>
        </div>
        <slot name="actions" />
    </form>
</template>

<script lang="ts">
import { defineComponent, h, computed } from 'vue'
import { Input } from '@airovo/uikit-shadcnui'
import { useField } from 'vee-validate'

export const FormFieldRender = defineComponent({
    name: 'FormFieldRender',
    props: {
        field: { type: Object as any, required: true },
        api: { type: Object as any, required: true },
        componentMap: { type: Object as any, required: true },
        deps: { type: Object as any, default: () => ({}) },
    },
    setup(p) {
        const field = p.field as any
        const rule = field.rules ? (val: any) => {
            const r = field.rules.safeParse(val === '' ? undefined : val)
            return r.success ? true : r.error.issues[0]?.message ?? '格式不正确'
        } : undefined
        const { value, errorMessage, handleChange, handleBlur } = useField(() => field.fieldName, rule, { validateOnBlur: true, validateOnChange: false })
        function onUpdate(v: any) { handleChange(v); p.api.setFieldValue(field.fieldName, v) }
        const resolved = computed(() => p.componentMap[field.component] ?? p.componentMap.Input ?? Input)
        return () => {
            const Comp = resolved.value; const deps = p.deps as any; const ch: any[] = []
            if (field.label) ch.push(h('label', { for: field.fieldName, class: 'text-sm font-medium leading-none' }, [field.label, (field.required || deps.required) ? h('span', { class: 'ml-0.5 text-destructive' }, '*') : null]))
            ch.push(h(Comp, { id: field.fieldName, modelValue: value.value ?? field.defaultValue ?? '', placeholder: field.componentProps?.placeholder ?? '请输入', disabled: field.disabled || deps.disabled, ...field.componentProps, ...deps.componentProps, 'onUpdate:modelValue': onUpdate, onBlur: handleBlur }))
            if (field.description) ch.push(h('p', { class: 'text-muted-foreground text-xs mt-1' }, field.description))
            if (errorMessage.value) ch.push(h('p', { class: 'text-destructive text-sm mt-1.5' }, errorMessage.value))
            return h('div', { class: 'space-y-2' }, ch)
        }
    },
})
</script>
