<script lang="ts" setup>

/**
 * FormFieldRender — 统一用 VeeFieldArray 渲染所有字段。
 *
 * 数据 shape（v5 风格）：
 *   - 所有字段在 form values 里都是数组
 *   - `values[fieldName]` 是 Array<{ [ArrayField]: T }>
 *   - 单值字段固定 1 行；数组字段（`array: true`）支持 push/remove
 *
 * placeholder / value 规则：
 *   - text-input 类组件默认 placeholder = "请输入"+label
 *   - 选择类默认 placeholder = "请选择"+label
 *   - 用户显式提供的 componentProps.placeholder 覆盖默认
 *   - componentProps 其他键整体合并到组件 props
 *
 * 字段值（modelValue + onInput）始终来自 vee-validate 的 v-slot
 * field，schema 的 componentProps 不覆盖这些。
 */
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
import { useForm, FieldArray as VeeFieldArray } from 'vee-validate'
import { computed } from 'vue'
import type { FormFieldSchema } from './types'

const props = defineProps<{
    schema: FormFieldSchema[]
}>()

/** 每行子对象的取值键。默认 'value'。 */
function getArrayField(item: FormFieldSchema): string {
    return item.ArrayField ?? 'value'
}

/** 单值字段初值（1 行），数组字段初值（空数组） */
const initialValues = props.schema.reduce((acc, item) => {
    acc[item.fieldName] = item.array ? [] : [{ [getArrayField(item)]: '' }]
    return acc
}, {} as Record<string, any>)

const { handleSubmit } = useForm({ initialValues })

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

const onSubmit = handleSubmit((values) => {
    // eslint-disable-next-line no-console
    console.log('Form values:', values)
})
</script>

<template>
    <form @submit.prevent="onSubmit">
        <FieldGroup>
            <!-- 统一 VeeFieldArray 模板：单值字段 length 1 固定，数组字段显示 push/remove -->
            <VeeFieldArray
                v-for="item in props.schema"
                :key="item.fieldName"
                v-slot="{ fields, push, remove }"
                :name="item.fieldName"
            >
                <FieldSet>
                    <FieldLegend
                        v-if="item.array"
                        variant="label"
                    >
                        {{ item.label || item.fieldName }}
                    </FieldLegend>

                    <div
                        v-for="(row, index) in fields"
                        :key="row.key"
                        class="flex items-start gap-2"
                    >
                        <VeeField
                            v-slot="{ field, errors, handleBlur }"
                            :name="`${item.fieldName}[${index}].${getArrayField(item)}`"
                        >
                            <Field
                                orientation="horizontal"
                                :data-invalid="!!errors.length"
                                class="flex-1"
                            >
                                <FieldContent>
                                    <FieldLabel :for="`AForm-${item.fieldName}-${index}`">
                                        <template v-if="item.array">
                                            {{ item.label || item.fieldName }} #{{ index + 1 }}
                                        </template>
                                        <template v-else>
                                            {{ item.label || item.fieldName }}
                                        </template>
                                    </FieldLabel>

                                    <FieldDescription v-if="item.description && index === 0">
                                        {{ item.description }}
                                    </FieldDescription>

                                    <component
                                        :id="`AForm-${item.fieldName}-${index}`"
                                        :is="getComponent(item.component)"
                                        :name="`${item.fieldName}[${index}].${getArrayField(item)}`"
                                        :modelValue="field.value"
                                        @update:modelValue="field.onInput"
                                        v-bind="getExtraProps(item)"
                                        :aria-invalid="!!errors.length"
                                        @blur="handleBlur"
                                    />
                                    <FieldError v-if="errors.length" :errors="errors" />
                                </FieldContent>
                            </Field>
                        </VeeField>

                        <Button
                            v-if="item.array && fields.length > 1"
                            type="button"
                            variant="ghost"
                            size="sm"
                            class="shrink-0 self-center text-muted-foreground"
                            @click="remove(index)"
                        >
                            删除
                        </Button>
                    </div>

                    <!-- 单值字段的"删除最后一行"被禁用：始终保留 1 行 -->
                    <Button
                        v-if="item.array"
                        type="button"
                        variant="outline"
                        size="sm"
                        class="mt-2 self-start"
                        @click="push({ [getArrayField(item)]: '' })"
                    >
                        + 添加
                    </Button>
                </FieldSet>
            </VeeFieldArray>
        </FieldGroup>
    </form>
</template>
