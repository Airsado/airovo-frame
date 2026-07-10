<script setup lang="ts">
import { computed, ref, watch, defineComponent, h, type Component } from 'vue'
import {
    Button,
    Input,
    Textarea,
} from '@airovo/uikit-shadcnui'
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

const DEFAULT_MAP: FormComponentMap = {
    Input,
    Password: Input,
    Number: Input,
    Email: Input,
    Textarea,
}
const mergedMap = computed(() => ({ ...DEFAULT_MAP, ...props.componentMap }))

// ── Collapsible ──

const isCollapsed = ref(props.collapsed ?? true)
const visibleSchema = computed(() => {
    if (!props.collapsible) return props.api.schema
    const rows = props.collapsedRows ?? 1
    const shouldCollapse = isCollapsed.value && props.api.schema.length > rows
    return shouldCollapse ? props.api.schema.slice(0, rows) : props.api.schema
})
const canToggle = computed(() => props.collapsible && props.api.schema.length > (props.collapsedRows ?? 1))
function toggleCollapse() { isCollapsed.value = !isCollapsed.value; emit('update:collapsed', isCollapsed.value) }

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

watch(() => {
    if (!props.api.form) return {}
    const vals: Record<string, any> = {}
    for (const f of props.api.schema)
        for (const t of f.dependencies?.triggerFields ?? [])
            vals[t] = props.api.form.values?.[t]
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
                <FormField
                    v-if="!evalDeps(field.dependencies).hidden && !field.hidden"
                    :field="field"
                    :api="api"
                    :component-map="mergedMap"
                    :deps="evalDeps(field.dependencies)"
                />
            </template>
        </div>

        <div v-if="canToggle" class="flex justify-center">
            <Button variant="ghost" size="sm" type="button" @click="toggleCollapse">
                {{ isCollapsed ? '展开更多' : '收起' }}
            </Button>
        </div>

        <div v-if="showDefaultActions" class="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" type="button" @click="handleReset">{{ resetButtonText }}</Button>
            <Button type="submit">{{ submitButtonText }}</Button>
        </div>
        <slot name="actions" />
    </form>
</template>

<!-- ═══════════ FormField (inline component with useField) ═══════════ -->
<script lang="ts">
import { defineComponent, h, computed, type PropType } from 'vue'

export const FormField = defineComponent({
    name: 'FormField',
    props: {
        field: { type: Object as PropType<FormFieldSchema>, required: true },
        api: { type: Object as PropType<FormApi>, required: true },
        componentMap: { type: Object as PropType<FormComponentMap>, required: true },
        deps: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
    },
    setup(props) {
        const field = props.field

        // Zod → vee-validate rule
        const rule = field.rules
            ? (val: any) => {
                const r = field.rules!.safeParse(val === '' ? undefined : val)
                return r.success ? true : r.error.issues[0]?.message ?? '格式不正确'
            }
            : undefined

        const { value, errorMessage, handleChange, handleBlur } = useField(
            () => field.fieldName,
            rule,
            { validateOnBlur: true, validateOnChange: false },
        )

        function onUpdate(v: any) {
            handleChange(v)
            props.api.setFieldValue(field.fieldName, v)
        }

        const resolved = computed(() => {
            const name = typeof field.component === 'string' ? field.component : ''
            return props.componentMap[name] ?? props.componentMap.Input ?? Input
        })

        const hasError = computed(() => !!errorMessage.value)

        return () => {
            const Comp = resolved.value
            const deps = props.deps as Record<string, any>
            const children: any[] = []

            // Label
            if (field.label) {
                children.push(h('label', {
                    for: field.fieldName,
                    class: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                }, [field.label, (field.required || deps.required) ? h('span', { class: 'ml-0.5 text-destructive' }, '*') : null]))
            }

            // Input component
            children.push(h(Comp, {
                id: field.fieldName,
                modelValue: value.value ?? field.defaultValue ?? '',
                placeholder: (field.componentProps as any)?.placeholder ?? '请输入',
                disabled: field.disabled || deps.disabled,
                ...field.componentProps,
                ...deps.componentProps,
                'onUpdate:modelValue': onUpdate,
                onBlur: handleBlur,
            }))

            // Description
            if (field.description) {
                children.push(h('p', {
                    class: 'text-muted-foreground text-xs mt-1',
                }, field.description))
            }

            // Error message
            if (hasError.value) {
                children.push(h('p', {
                    class: 'text-destructive text-sm font-normal mt-1.5',
                }, errorMessage.value))
            }

            return h('div', { class: 'space-y-2' }, children)
        }
        }
    },
})
</script>
