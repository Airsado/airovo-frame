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
} from '@airovo/uikit-shadcnui'
import { Field as VeeField, FieldArray as VeeFieldArray } from 'vee-validate'

import type { FormFieldSchema } from './types'
import { parseRules } from './rules'

const props = defineProps<{
    schema: FormFieldSchema[]
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
    // select, checkbox, radio, textarea, datepicker, ...
}
const TEXT_INPUT_COMPONENTS = new Set([
    'input', 'Input',
    'textarea', 'Textarea',
    'password', 'Password',
    'number', 'Number',
    'email', 'Email',
])

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
    const userProps = (item.componentProps ?? {}) as Record<string, unknown>
    const isText = isTextInput(item.component)
    const defaultPlaceholder = isText
        ? `请输入${item.label}`
        : `请选择${item.label}`
    return {
        ...userProps,
        placeholder: userProps.placeholder ?? defaultPlaceholder,
    }
}
</script>

<template>
    <!-- 数组字段的 VeeFieldArray 模板 -->
    <FieldGroup>
        <template v-for="(item, idx) in props.schema" :key="item.fieldName + ':' + idx">
            <VeeFieldArray v-slot="{ fields, push, remove }" :name="item.fieldName">
                <FieldSet>
                    <FieldLegend v-if="item.array" variant="label">
                        {{ item.label || item.fieldName }}
                    </FieldLegend>

                    <div v-for="(row, index) in fields" :key="row.key" class="flex items-start gap-2">
                        <VeeField v-slot="{ field, errors, handleBlur }"
                            :name="`${item.fieldName}[${index}].${getArrayField(item)}`"
                            :rules="(parseRules(item.rules) as any)">
                            <Field orientation="horizontal" :data-invalid="!!errors.length" class="flex-1">
                                <FieldContent>
                                    <FieldLabel :for="`AForm-${item.fieldName}-${index}`" v-if="!item.array">
                                        {{ item.label || item.fieldName }}
                                    </FieldLabel>

                                    <FieldDescription v-if="item.description && index === 0">
                                        {{ item.description }}
                                    </FieldDescription>

                                    <component :id="`AForm-${item.fieldName}-${index}`"
                                        :is="getComponent(item.component)"
                                        :name="`${item.fieldName}[${index}].${getArrayField(item)}`"
                                        :modelValue="field.value" @update:modelValue="field.onInput"
                                        v-bind="getExtraProps(item)" :aria-invalid="!!errors.length"
                                        @blur="handleBlur" />

                                    <FieldError v-if="errors.length" :errors="errors" />
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
                                @click="remove(index)">s
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
                            @click="push({ [getArrayField(item)]: '' })">
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
