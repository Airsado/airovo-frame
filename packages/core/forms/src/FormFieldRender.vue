<script lang="ts" setup>
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldSet,
    FieldLegend,
    Input,
    Button,
    Textarea,
} from '@airovo/uikit-shadcnui'
import { SelectBox } from '@airovo/components'
import { Field as VeeField, FieldArray as VeeFieldArray } from 'vee-validate'
import { watchEffect } from 'vue'

import type { FormFieldSchema } from './types'
import { isRequiredRule, parseRules } from './rules'
import FormFieldNodes from './FormFieldNodes.vue'
import FormRequiredMark from './FormRequiredMark.vue'
import { useFieldId } from './form-dom'

const fieldId = useFieldId()

const props = defineProps<{
    schema: FormFieldSchema[]
    api: import('./form-api').FormApi
}>()

/** 每行子对象的取值键。默认 'value'。 */
function getArrayField(item: FormFieldSchema): string {
    return item.ArrayField ?? 'value'
}

/** "+ 添加" 按钮文案 */
function getAddLabel(item: FormFieldSchema): string {
    return item.addButtonText ?? '+ 添加'
}

/** "删除" 按钮文案 */
function getRemoveLabel(item: FormFieldSchema): string {
    return item.removeButtonText ?? '删除'
}

/** 是否达到行数上限 */
function isAtMax(item: FormFieldSchema, length: number): boolean {
    return typeof item.maxItems === 'number' && length >= item.maxItems
}


// ── 组件映射 ──
const componentMap: Record<string, any> = {
    input: Input,
    Input,
    textarea: Textarea,
    Textarea,
    password: Input,
    Password: Input,
    number: Input,
    Number: Input,
    email: Input,
    Email: Input,
    select: SelectBox,
    Select: SelectBox,
    // select, checkbox, radio, textarea, datepicker, ...
}
const TEXT_INPUT_COMPONENTS = new Set([
    'input', 'Input',
    'textarea', 'Textarea',
    'password', 'Password',
    'number', 'Number',
    'email', 'Email',
])
const INPUT_TYPES: Record<string, string | undefined> = {
    Password: 'password', password: 'password',
    Number: 'number', number: 'number',
    Email: 'email', email: 'email',
}

function isTextInput(component: FormFieldSchema['component']): boolean {
    if (typeof component !== 'string') return true
    return TEXT_INPUT_COMPONENTS.has(component)
}

function getComponent(component: FormFieldSchema['component']) {
    if (typeof component === 'string') {
        return componentMap[component] || Input
    }
    return component
}

/**
 * 合并 schema 的 componentProps + 默认 placeholder
 */
function getExtraProps(item: FormFieldSchema): Record<string, unknown> {
    const context = { values: props.api.values.value, api: props.api, fieldName: item.fieldName }
    const configuredProps = typeof item.componentProps === 'function'
        ? item.componentProps(context)
        : item.componentProps
    const dependencyProps = resolve(item.dependencies?.componentProps, {}, context)
    const userProps = { ...(configuredProps ?? {}), ...dependencyProps } as Record<string, unknown>
    const isText = isTextInput(item.component)
    const defaultPlaceholder = isText
        ? `请输入${item.label}`
        : `请选择${item.label}`
    return {
        ...userProps,
        placeholder: userProps.placeholder ?? defaultPlaceholder,
        type: userProps.type ?? (typeof item.component === 'string'
            ? INPUT_TYPES[item.component]
            : undefined),
    }
}

type DependencyContext = {
    values: Record<string, unknown>
    api: typeof props.api
    fieldName?: string
    value?: unknown
}

function resolve<T>(
    value: T | ((context: DependencyContext) => T) | undefined,
    fallback: T,
    context: DependencyContext = { values: props.api.values.value, api: props.api },
): T {
    if (typeof value === 'function') {
        return (value as (context: DependencyContext) => T)(context)
    }
    return value ?? fallback
}

function readPath(values: Record<string, unknown>, path: string): unknown {
    return path
        .replace(/\[(\d+)\]/g, '.$1')
        .split('.')
        .filter(Boolean)
        .reduce<unknown>((current, key) => (
            current && typeof current === 'object'
                ? (current as Record<string, unknown>)[key]
                : undefined
        ), values)
}

function hasPath(values: Record<string, unknown>, path: string): boolean {
    const segments = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
    let current: unknown = values
    for (const segment of segments) {
        if (!current || typeof current !== 'object' || !Object.hasOwn(current, segment)) return false
        current = (current as Record<string, unknown>)[segment]
    }
    return true
}

function touchDependencyValues(item: FormFieldSchema): void {
    const values = props.api.values.value
    for (const field of item.dependencies?.triggerFields ?? []) readPath(values, field)
}

function dependencyValue<T>(item: FormFieldSchema, key: 'if' | 'show' | 'disabled', fallback: T): T {
    touchDependencyValues(item)
    const dependency = item.dependencies?.[key]
    return resolve(dependency as T | ((context: DependencyContext) => T) | undefined, fallback, {
        values: props.api.values.value,
        api: props.api,
        fieldName: item.fieldName,
    })
}

function fieldRules(item: FormFieldSchema): FormFieldSchema['rules'] {
    const context = {
        values: props.api.values.value,
        api: props.api,
        fieldName: item.fieldName,
    }
    const rules = resolve(item.dependencies?.rules, item.rules, context)
    const required = resolve(item.dependencies?.required, false, context)
    if (!required) return rules
    if (typeof rules === 'string') {
        return rules.split(',').some((token) => token.trim() === 'required')
            ? rules
            : rules ? `${rules},required` : 'required'
    }
    return rules ?? 'required'
}

function isRequired(item: FormFieldSchema): boolean {
    return isRequiredRule(fieldRules(item))
}

function handleInput(item: FormFieldSchema, onInput: (value: unknown) => void, value: unknown): void {
    onInput(value)
    const callback = item.dependencies?.onChange
    if (!callback) return
    void callback(value, {
        values: props.api.values.value,
        api: props.api,
        fieldName: item.fieldName,
        value,
    })
}

function isRendered(item: FormFieldSchema): boolean {
    return dependencyValue(item, 'if', true)
        && dependencyValue(item, 'show', true)
        && resolve(item.show, true)
}

function isVisible(item: FormFieldSchema): boolean {
    return dependencyValue(item, 'show', true) && resolve(item.show, true)
}

function isDisabled(item: FormFieldSchema): boolean {
    return dependencyValue(item, 'disabled', false) || resolve(item.disabled, false)
}

function getError(item: FormFieldSchema, index: number): string | undefined {
    return props.api.errors.value[`${item.fieldName}[${index}].${getArrayField(item)}`]
        ?? props.api.errors.value[item.fieldName]
}

function fieldPath(item: FormFieldSchema, index: number): string {
    return `${item.fieldName}[${index}].${getArrayField(item)}`
}

function createRow(item: FormFieldSchema): Record<string, unknown> {
    if (item.children?.length) {
        return Object.fromEntries(item.children.map((child) => [
            child.fieldName,
            child.array
                ? [createRow(child)]
                : child.children?.length
                    ? createRow(child)
                    : resolve(child.defaultValue, ''),
        ]))
    }
    return { [getArrayField(item)]: resolve(item.defaultValue, '') }
}

watchEffect(() => {
    const values = props.api.values.value
    for (const item of props.schema) {
        if (!isRendered(item) || hasPath(values, item.fieldName)) continue
        const initial = readPath(props.api.initialValues, item.fieldName)
        const value = initial ?? [createRow(item)]
        props.api.setFieldValue(item.fieldName, value)
    }
}, { flush: 'post' })
</script>

<template>
    <!-- 数组字段的 VeeFieldArray 模板 -->
    <FieldGroup>
        <template v-for="(item, idx) in props.schema" :key="item.fieldName + ':' + idx">
            <VeeFieldArray v-if="isRendered(item)" v-slot="{ fields, push, remove }" :name="item.fieldName">
                <FieldSet v-show="isVisible(item)">
                    <FieldLegend v-if="item.array" :id="`${fieldId(item.fieldName)}-label`" variant="label">
                        {{ item.label || item.fieldName }}
                        <FormRequiredMark :required="!item.children?.length && isRequired(item)" />
                    </FieldLegend>

                    <div v-for="(row, index) in fields" :key="row.key" class="flex items-start gap-2">
                        <div v-if="item.children?.length" class="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                            <FormFieldNodes
                                :schema="item.children"
                                :api="props.api"
                                :base-path="`${item.fieldName}[${index}]`"
                            />
                        </div>
                        <VeeField v-else v-slot="{ field, errors, handleBlur }"
                            :name="fieldPath(item, index)"
                            :rules="(parseRules(fieldRules(item)) as any)">
                            <Field :orientation="props.api.props.layout === 'horizontal' ? 'horizontal' : 'vertical'"
                                :data-invalid="!!getError(item, index) || !!errors.length" class="flex-1">
                                <FieldContent>
                                    <FieldLabel :for="fieldId(fieldPath(item, index))" v-if="!item.array">
                                        {{ item.label || item.fieldName }}
                                        <FormRequiredMark :required="isRequired(item)" />
                                    </FieldLabel>
                                    <FieldDescription v-if="item.description && index === 0">
                                        {{ item.description }}
                                    </FieldDescription>
                                    <component :id="fieldId(fieldPath(item, index))"
                                        :is="getComponent(item.component)"
                                        :name="fieldPath(item, index)"
                                        :modelValue="field.value" @update:modelValue="handleInput(item, field.onInput, $event)"
                                        v-bind="getExtraProps(item)"
                                        :disabled="props.api.disabled || props.api.loading || isDisabled(item)"
                                        :aria-invalid="!!getError(item, index) || !!errors.length"
                                        :aria-labelledby="item.array ? `${fieldId(item.fieldName)}-label` : undefined"
                                        :aria-required="isRequired(item) || undefined"
                                        @blur="handleBlur" />
                                    <FieldError v-if="getError(item, index) || errors.length"
                                        :errors="[getError(item, index) ?? errors[0]]" />
                                </FieldContent>
                            </Field>
                        </VeeField>

                        <!-- 删除按钮：左右插槽 + 自定义文案 + 条件显示 -->
                        <div v-if="item.array && fields.length > 1"
                            class="flex shrink-0 items-center self-center gap-1">
                            <slot :name="`array-remove-prefix-${item.fieldName}`" :item="item" :index="index"
                                :fields="fields" />
                            <slot name="array-remove-prefix" :item="item" :index="index" :fields="fields" />
                            <Button type="button" variant="ghost" size="sm" class="text-muted-foreground"
                                @click="remove(index)">
                                {{ getRemoveLabel(item) }}
                            </Button>
                            <slot name="array-remove-suffix" :item="item" :index="index" :fields="fields" />
                            <slot :name="`array-remove-suffix-${item.fieldName}`" :item="item" :index="index"
                                :fields="fields" />
                        </div>
                    </div>

                    <!-- 添加按钮：左右插槽 + 自定义文案 + 行数上限禁用 -->
                    <div v-if="item.array" class="flex items-center gap-1 self-start">
                        <slot :name="`array-add-prefix-${item.fieldName}`" :item="item" :fields="fields" />
                        <slot name="array-add-prefix" :item="item" :fields="fields" />
                        <Button type="button" variant="outline" size="sm" :disabled="isAtMax(item, fields.length)"
                            @click="push(createRow(item))">
                            {{ getAddLabel(item) }}
                            <span v-if="item.maxItems" class="ml-1 text-xs text-muted-foreground">
                                ({{ fields.length }}/{{ item.maxItems }})
                            </span>
                        </Button>
                        <slot name="array-add-suffix" :item="item" :fields="fields" />
                        <slot :name="`array-add-suffix-${item.fieldName}`" :item="item" :fields="fields" />
                    </div>
                </FieldSet>
            </VeeFieldArray>
        </template>
    </FieldGroup>
</template>
