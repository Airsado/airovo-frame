<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue'
import {
    Field,
    FieldLabel,
    FieldError,
    FieldDescription,
    Input,
    Textarea,
} from '@airovo/uikit-shadcnui'
import type { AFormSchema, AFormField } from './AForm.types'

const props = defineProps<{
    schema: AFormSchema
    values: T
    errors: Record<string, string | undefined>
}>()

const emit = defineEmits<{
    'update:values': [values: T]
    'submit': [values: T]
}>()

const fieldList = computed(() => props.schema.fields?.filter((f) => !f.hidden) ?? [])

function getFieldValue(fieldName: string): unknown {
    return props.values[fieldName]
}

function getFieldError(fieldName: string): string | undefined {
    return props.errors[fieldName]
}

function updateFieldValue(fieldName: string, value: unknown) {
    emit('update:values', { ...props.values, [fieldName]: value })
}

const inputTypeMap: Record<string, string> = {
    Password: 'password',
    Number: 'number',
    Email: 'email',
}

function inputType(component: string | undefined): string {
    return inputTypeMap[component ?? ''] ?? 'text'
}

function onSubmit(e: Event) {
    e.preventDefault()
    emit('submit', props.values)
}
</script>

<template>
    <form class="space-y-4" @submit="onSubmit">
        <div
            v-for="field in fieldList"
            :key="field.fieldName"
            class="space-y-2"
        >
            <Field :name="field.fieldName">
                <FieldLabel
                    v-if="field.label"
                    :for="field.fieldName"
                >
                    {{ field.label }}
                </FieldLabel>

                <slot
                    :name="field.fieldName"
                    :field="field"
                    :value="getFieldValue(field.fieldName)"
                    :error="getFieldError(field.fieldName)"
                    :update="(val: unknown) => updateFieldValue(field.fieldName, val)"
                >
                    <!-- Textarea -->
                    <Textarea
                        v-if="field.component === 'Textarea'"
                        :id="field.fieldName"
                        :model-value="getFieldValue(field.fieldName) ?? ''"
                        :placeholder="(field.componentProps?.placeholder as string) ?? '请输入'"
                        :disabled="field.disabled"
                        v-bind="field.componentProps"
                        @update:model-value="(v) => updateFieldValue(field.fieldName, v)"
                    />

                    <!-- All other input types -->
                    <Input
                        v-else
                        :id="field.fieldName"
                        :type="inputType(field.component)"
                        :model-value="String(getFieldValue(field.fieldName) ?? '')"
                        :placeholder="(field.componentProps?.placeholder as string) ?? '请输入'"
                        :disabled="field.disabled"
                        v-bind="field.componentProps"
                        @update:model-value="(v) => updateFieldValue(field.fieldName, v)"
                    />
                </slot>

                <FieldDescription v-if="field.description">
                    {{ field.description }}
                </FieldDescription>
                <FieldError
                    v-if="getFieldError(field.fieldName)"
                    :errors="[getFieldError(field.fieldName)!]"
                />
            </Field>
        </div>

        <slot name="actions" />
    </form>
</template>
