<script lang="ts" setup>
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldLabel,
    FieldLegend,
    FieldSet,
    Input,
    Textarea,
    Button,
} from '@airovo/uikit-shadcnui'
import { SelectBox } from '@airovo/components'
import { Field as VeeField, FieldArray as VeeFieldArray } from 'vee-validate'
import { watchEffect } from 'vue'

import type { FormFieldSchema } from './types'
import { isRequiredRule, parseRules } from './rules'
import FormRequiredMark from './FormRequiredMark.vue'

const props = defineProps<{
    schema: FormFieldSchema[]
    api: import('./form-api').FormApi
    /** Path of the object/array row that owns this schema. */
    basePath?: string
}>()

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

function getArrayField(item: FormFieldSchema): string {
    return item.ArrayField ?? 'value'
}

function getComponent(component: FormFieldSchema['component']) {
    return typeof component === 'string' ? componentMap[component] || Input : component
}

function resolve<T>(
    value: T | ((context: { values: Record<string, unknown>; api: typeof props.api; fieldName?: string; value?: unknown }) => T) | undefined,
    fallback: T,
    context: { values: Record<string, unknown>; api: typeof props.api; fieldName?: string; value?: unknown } = {
        values: props.api.values.value,
        api: props.api,
    },
): T {
    if (typeof value === 'function') {
        return (value as (context: { values: Record<string, unknown>; api: typeof props.api; fieldName?: string; value?: unknown }) => T)(context)
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

function scopedTriggerPath(trigger: string): string {
    if (trigger.startsWith('$root.')) return trigger.slice('$root.'.length)
    if (trigger.startsWith('$row.')) {
        return props.basePath ? `${props.basePath}.${trigger.slice('$row.'.length)}` : trigger.slice('$row.'.length)
    }
    if (trigger.startsWith('.')) return `${props.basePath ?? ''}${trigger}`
    return props.basePath ? `${props.basePath}.${trigger}` : trigger
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

function fieldPath(item: FormFieldSchema): string {
    return props.basePath ? `${props.basePath}.${item.fieldName}` : item.fieldName
}

function isTextInput(component: FormFieldSchema['component']): boolean {
    return typeof component !== 'string' || TEXT_INPUT_COMPONENTS.has(component)
}

function getExtraProps(item: FormFieldSchema): Record<string, unknown> {
    const context = { values: props.api.values.value, api: props.api, fieldName: fieldPath(item) }
    const configuredProps = typeof item.componentProps === 'function'
        ? item.componentProps(context)
        : item.componentProps
    const dependencyProps = resolve(item.dependencies?.componentProps, {}, context)
    const userProps = { ...(configuredProps ?? {}), ...dependencyProps } as Record<string, unknown>
    return {
        ...userProps,
        placeholder: userProps.placeholder ?? (isTextInput(item.component)
            ? `请输入${item.label}`
            : `请选择${item.label}`),
        type: userProps.type ?? (typeof item.component === 'string'
            ? INPUT_TYPES[item.component]
            : undefined),
    }
}

function dependencyValue<T>(item: FormFieldSchema, key: 'if' | 'show' | 'disabled', fallback: T): T {
    const values = props.api.values.value
    for (const trigger of item.dependencies?.triggerFields ?? []) readPath(values, scopedTriggerPath(trigger))
    const dependency = item.dependencies?.[key]
    return resolve(dependency as T | ((context: { values: Record<string, unknown>; api: typeof props.api }) => T) | undefined, fallback, {
        values,
        api: props.api,
        fieldName: fieldPath(item),
    })
}

function isRendered(item: FormFieldSchema): boolean {
    return dependencyValue(item, 'if', true) && resolve(item.show, true)
}

function isVisible(item: FormFieldSchema): boolean {
    return dependencyValue(item, 'show', true) && resolve(item.show, true)
}

function isDisabled(item: FormFieldSchema): boolean {
    return dependencyValue(item, 'disabled', false) || resolve(item.disabled, false)
}

function getError(path: string, item: FormFieldSchema): string | undefined {
    return props.api.errors.value[path]
        ?? props.api.errors.value[fieldPath(item)]
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

function addLabel(item: FormFieldSchema): string {
    return item.addButtonText ?? '+ 添加'
}

function removeLabel(item: FormFieldSchema): string {
    return item.removeButtonText ?? '删除'
}

function isRequired(item: FormFieldSchema): boolean {
    return isRequiredRule(fieldRules(item))
}

function fieldRules(item: FormFieldSchema): FormFieldSchema['rules'] {
    const context = {
        values: props.api.values.value,
        api: props.api,
        fieldName: fieldPath(item),
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

function handleInput(item: FormFieldSchema, onInput: (value: unknown) => void, value: unknown): void {
    onInput(value)
    const callback = item.dependencies?.onChange
    if (!callback) return
    void callback(value, {
        values: props.api.values.value,
        api: props.api,
        fieldName: fieldPath(item),
        value,
    })
}

watchEffect(() => {
    const values = props.api.values.value
    for (const item of props.schema) {
        const path = fieldPath(item)
        if (!isRendered(item) || hasPath(values, path)) continue
        props.api.setFieldValue(
            path,
            item.array || item.children?.length
                ? item.array
                    ? [createRow(item)]
                    : createRow(item)
                : resolve(item.defaultValue, ''),
        )
    }
}, { flush: 'post' })
</script>

<template>
    <template v-for="item in props.schema" :key="fieldPath(item)">
        <VeeFieldArray
            v-if="item.array && isRendered(item)"
            v-slot="{ fields, push, remove }"
            :name="fieldPath(item)"
        >
            <FieldSet v-show="isVisible(item)">
                <FieldLegend variant="label">
                    {{ item.label || item.fieldName }}
                    <FormRequiredMark :required="!item.children?.length && isRequired(item)" />
                </FieldLegend>
                <div v-for="(row, index) in fields" :key="row.key" class="flex items-start gap-2">
                    <div v-if="item.children?.length" class="min-w-0 flex-1">
                        <FormFieldNodes
                            :schema="item.children"
                            :api="props.api"
                            :base-path="`${fieldPath(item)}[${index}]`"
                        />
                    </div>
                    <VeeField
                        v-else
                        v-slot="{ field, errors, handleBlur }"
                        :name="`${fieldPath(item)}[${index}].${getArrayField(item)}`"
                        :rules="(parseRules(fieldRules(item)) as any)"
                    >
                        <Field
                            :orientation="props.api.props.layout === 'horizontal' ? 'horizontal' : 'vertical'"
                            class="min-w-0 flex-1"
                            :data-invalid="!!getError(`${fieldPath(item)}[${index}].${getArrayField(item)}`, item) || !!errors.length"
                        >
                            <FieldContent>
                                <FieldDescription v-if="item.description && index === 0">
                                    {{ item.description }}
                                </FieldDescription>
                                <component
                                    :is="getComponent(item.component)"
                                    :id="`AForm-${fieldPath(item)}-${index}`"
                                    :name="`${fieldPath(item)}[${index}].${getArrayField(item)}`"
                                    :model-value="field.value"
                                    v-bind="getExtraProps(item)"
                                    :disabled="props.api.disabled || props.api.loading || isDisabled(item)"
                                    :aria-invalid="!!getError(`${fieldPath(item)}[${index}].${getArrayField(item)}`, item) || !!errors.length"
                                    :aria-required="isRequired(item) || undefined"
                                    @update:model-value="handleInput(item, field.onInput, $event)"
                                    @blur="handleBlur"
                                />
                                <FieldError
                                    v-if="getError(`${fieldPath(item)}[${index}].${getArrayField(item)}`, item) || errors.length"
                                    :errors="[getError(`${fieldPath(item)}[${index}].${getArrayField(item)}`, item) ?? errors[0]]"
                                />
                            </FieldContent>
                        </Field>
                    </VeeField>
                    <Button
                        v-if="fields.length > 1"
                        type="button"
                        variant="ghost"
                        size="sm"
                        class="text-muted-foreground"
                        @click="remove(index)"
                    >
                        {{ removeLabel(item) }}
                    </Button>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    :disabled="typeof item.maxItems === 'number' && fields.length >= item.maxItems"
                    @click="push(createRow(item))"
                >
                    {{ addLabel(item) }}
                    <span v-if="item.maxItems" class="ml-1 text-xs text-muted-foreground">
                        ({{ fields.length }}/{{ item.maxItems }})
                    </span>
                </Button>
            </FieldSet>
        </VeeFieldArray>

        <FieldSet v-else-if="item.children?.length && isRendered(item)" v-show="isVisible(item)">
            <FieldLegend v-if="item.label" variant="label">
                {{ item.label }}
            </FieldLegend>
            <FormFieldNodes
                :schema="item.children"
                :api="props.api"
                :base-path="fieldPath(item)"
            />
        </FieldSet>

        <VeeField
            v-else-if="isRendered(item)"
            v-slot="{ field, errors, handleBlur }"
            :name="fieldPath(item)"
            :rules="(parseRules(fieldRules(item)) as any)"
        >
            <Field
                :orientation="props.api.props.layout === 'horizontal' ? 'horizontal' : 'vertical'"
                :data-invalid="!!getError(fieldPath(item), item) || !!errors.length"
            >
                <FieldContent>
                    <FieldLabel :for="`AForm-${fieldPath(item)}`">
                        {{ item.label || item.fieldName }}
                        <FormRequiredMark :required="isRequired(item)" />
                    </FieldLabel>
                    <FieldDescription v-if="item.description">
                        {{ item.description }}
                    </FieldDescription>
                    <component
                        :is="getComponent(item.component)"
                        :id="`AForm-${fieldPath(item)}`"
                        :name="fieldPath(item)"
                        :model-value="field.value"
                        v-bind="getExtraProps(item)"
                        :disabled="props.api.disabled || props.api.loading || isDisabled(item)"
                        :aria-invalid="!!getError(fieldPath(item), item) || !!errors.length"
                        :aria-required="isRequired(item) || undefined"
                        @update:model-value="handleInput(item, field.onInput, $event)"
                        @blur="handleBlur"
                    />
                    <FieldError
                        v-if="getError(fieldPath(item), item) || errors.length"
                        :errors="[getError(fieldPath(item), item) ?? errors[0]]"
                    />
                </FieldContent>
            </Field>
        </VeeField>
    </template>
</template>
