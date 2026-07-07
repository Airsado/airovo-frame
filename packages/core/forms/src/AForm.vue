<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue'
import {
    Field,
    FieldLabel,
    FieldError,
    FieldDescription,
    Input,
} from '@airovo/uikit-shadcnui'
import type { AFormSchema, AFormField } from './AForm.types'

type InputKind = 'text' | 'password' | 'number' | 'email' | 'textarea'

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

function handleInput(fieldName: string, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement
    updateFieldValue(fieldName, target.value)
}

function inputType(kind: string | undefined): InputKind {
    if (kind === 'Password') return 'password'
    if (kind === 'Number') return 'number'
    if (kind === 'Email') return 'email'
    if (kind === 'Textarea') return 'text'
    return 'text'
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
            <Field>
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
                    <textarea
                        v-if="field.component === 'Textarea'"
                        :id="field.fieldName"
                        :value="getFieldValue(field.fieldName) ?? ''"
                        :placeholder="(field.componentProps?.placeholder as string) ?? '请输入'"
                        :disabled="field.disabled"
                        class="flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        v-bind="field.componentProps"
                        @input="handleInput(field.fieldName, $event)"
                    />
                    <Input
                        v-else
                        :id="field.fieldName"
                        :type="inputType(field.component)"
                        :value="getFieldValue(field.fieldName)"
                        :placeholder="(field.componentProps?.placeholder as string) ?? '请输入'"
                        :disabled="field.disabled"
                        v-bind="field.componentProps"
                        @update:model-value="(v: unknown) => updateFieldValue(field.fieldName, v)"
                        @input="handleInput(field.fieldName, $event)"
                    />
                </slot>

                <FieldDescription v-if="field.description">
                    {{ field.description }}
                </FieldDescription>
                <FieldError
                    v-if="getFieldError(field.fieldName)"
                    :errors="[getFieldError(field.fieldName) as string]"
                />
            </Field>
        </div>

        <slot name="actions" />
    </form>
</template>
