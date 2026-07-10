<script setup lang="ts">
import { computed, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import {
    Button,
    Field,
    FieldLabel,
    FieldError,
    FieldDescription,
    Input,
    Textarea,
} from '@airovo/uikit-shadcnui'
import type { FormComponentMap, FormFieldSchema, FormFieldDependencies } from './types'
import { FormApi } from './form-api'

// ── Props ──

const props = withDefaults(
    defineProps<{
        api: FormApi
        componentMap?: FormComponentMap
        /** Tailwind grid class. Default: 'grid-cols-1'. */
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

const emit = defineEmits<{
    'update:collapsed': [value: boolean]
}>()

// ── Default component map ──

const DEFAULT_MAP: FormComponentMap = {
    Input,
    Password: Input,
    Number: Input,
    Email: Input,
    Textarea,
    Select: Input,     // placeholder — swap in real Select later
    Switch: Input,     // placeholder
    DatePicker: Input, // placeholder
}

const mergedMap = computed(() => ({ ...DEFAULT_MAP, ...props.componentMap }))

// ── Collapsible state ──

const isCollapsed = ref(props.collapsed ?? true)

const visibleSchema = computed(() => {
    if (!props.collapsible) return props.api.schema
    const rows = props.collapsedRows ?? 1
    const shouldCollapse = isCollapsed.value && props.api.schema.length > rows
    return shouldCollapse ? props.api.schema.slice(0, rows) : props.api.schema
})

const canToggle = computed(
    () => props.collapsible && props.api.schema.length > (props.collapsedRows ?? 1),
)

function toggleCollapse(): void {
    isCollapsed.value = !isCollapsed.value
    emit('update:collapsed', isCollapsed.value)
}

// ── Dependencies tracking ──

const depValues = ref<Record<string, any>>({})

/** Evaluate dependencies for a field, returns overrides. */
function evalDeps(deps: FormFieldDependencies | undefined): {
    hidden?: boolean
    disabled?: boolean
    required?: boolean
    componentProps?: Record<string, any>
} {
    if (!deps) return {}
    const vals = depValues.value
    return {
        hidden: deps.hidden?.(vals, props.api),
        disabled: deps.disabled?.(vals, props.api),
        required: deps.required?.(vals, props.api),
        componentProps: deps.componentProps?.(vals, props.api),
    }
}

// Watch all triggerFields and update the depValues snapshot
const allTriggerFields = computed(() => {
    const names = new Set<string>()
    for (const f of props.api.schema) {
        for (const t of f.dependencies?.triggerFields ?? []) {
            names.add(t)
        }
    }
    return [...names]
})

watch(
    allTriggerFields,
    () => {
        if (!props.api.form) return
        const vals: Record<string, any> = {}
        for (const name of allTriggerFields.value) {
            vals[name] = props.api.form.values[name]
        }
        depValues.value = vals
    },
    { immediate: true, deep: false },
)

// Re-evaluate when any trigger field value changes
watch(
    () => {
        if (!props.api.form) return {}
        const vals: Record<string, any> = {}
        for (const name of allTriggerFields.value) {
            vals[name] = props.api.form.values[name]
        }
        return vals
    },
    (vals) => {
        depValues.value = vals ?? {}
    },
    { deep: true },
)

// ── Resolve component for a field ──

function resolveComponent(field: FormFieldSchema) {
    if (!field.component) return mergedMap.value.Input
    if (typeof field.component === 'string') {
        return mergedMap.value[field.component] ?? mergedMap.value.Input
    }
    return field.component
}

// ── Handlers ──

function getValue(fieldName: string): any {
    return props.api.form?.values?.[fieldName]
}

function getError(fieldName: string): string | undefined {
    return props.api.form?.errors?.[fieldName] as string | undefined
}

async function handleSubmit(e: Event): Promise<void> {
    await props.api.submitForm(e)
}

async function handleReset(): Promise<void> {
    await props.api.resetForm()
}

// ── Mount / Unmount ──

provide('formApi', props.api)
</script>

<template>
    <form class="space-y-4" @submit="handleSubmit">
        <div :class="['grid gap-4', wrapperClass]">
            <template v-for="field in visibleSchema" :key="field.fieldName">
                <!-- Hidden fields skip rendering entirely -->
                <template v-if="!evalDeps(field.dependencies).hidden && !field.hidden">
                    <Field :name="field.fieldName">
                        <FieldLabel v-if="field.label" :for="field.fieldName">
                            {{ field.label }}
                            <span
                                v-if="field.required || evalDeps(field.dependencies).required"
                                class="ml-0.5 text-destructive"
                            >*</span>
                        </FieldLabel>

                        <component
                            :is="resolveComponent(field)"
                            :id="field.fieldName"
                            :model-value="getValue(field.fieldName) ?? field.defaultValue ?? ''"
                            :placeholder="(field.componentProps?.placeholder as string) ?? '请输入'"
                            :disabled="field.disabled || evalDeps(field.dependencies).disabled"
                            v-bind="{ ...field.componentProps, ...evalDeps(field.dependencies).componentProps }"
                            @update:model-value="(v: any) => props.api.setFieldValue(field.fieldName, v)"
                            @blur="() => props.api.validateField(field.fieldName)"
                        />

                        <FieldDescription v-if="field.description">
                            {{ field.description }}
                        </FieldDescription>
                        <FieldError v-if="getError(field.fieldName)" :errors="[getError(field.fieldName)!]" class="mt-1.5" />
                    </Field>
                </template>
            </template>
        </div>

        <!-- Collapse toggle -->
        <div v-if="canToggle" class="flex justify-center">
            <Button variant="ghost" size="sm" type="button" @click="toggleCollapse">
                {{ isCollapsed ? '展开更多' : '收起' }}
            </Button>
        </div>

        <!-- Built-in actions -->
        <div v-if="showDefaultActions" class="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" type="button" @click="handleReset">
                {{ resetButtonText }}
            </Button>
            <Button type="submit">
                {{ submitButtonText }}
            </Button>
        </div>

        <!-- Custom actions slot -->
        <slot name="actions" />
    </form>
</template>
