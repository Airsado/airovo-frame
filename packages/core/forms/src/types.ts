import type { Component, ComputedRef, Ref } from 'vue'
import type { ZodTypeAny } from 'zod'

export type BuiltInFormComponent =
    | 'Input'
    | 'Textarea'
    | 'Password'
    | 'Number'
    | 'Email'
    | 'Select'
    | 'DatePicker'
    | 'date'
    | 'DateTimePicker'
    | 'datetime'

export type FormComponent = Component | BuiltInFormComponent

export interface FormFieldContext {
    values: Record<string, unknown>
    api: FormApiLike
    /** Public field path that caused the callback (when applicable). */
    fieldName?: string
    /** Current value passed to a dependency callback. */
    value?: unknown
}

type Dynamic<T> = T | ((context: FormFieldContext) => T)

export interface FormFieldSchema {
    fieldName: string
    label: string
    component: FormComponent
    componentProps?: Record<string, unknown> | ((context: FormFieldContext) => Record<string, unknown>)
    description?: string
    rules?: ZodTypeAny | string
    show?: Dynamic<boolean>
    disabled?: Dynamic<boolean>
    defaultValue?: Dynamic<unknown>
    dependencies?: FormFieldDependencies
    /** Nested field schema used by grouped/array fields. */
    children?: FormFieldSchema[]
    ArrayField?: string
    array?: boolean
    maxItems?: number
    addButtonText?: string
    removeButtonText?: string
}

/**
 * A small, framework-safe subset of Vben's dependency contract.  The
 * trigger list documents which values drive the field and the callbacks are
 * evaluated with the same context as `show`/`disabled`.  Keeping this shape
 * in the core package lets apps opt into dependent fields without importing
 * a renderer-private type.
 */
export interface FormFieldDependencies {
    triggerFields: string[]
    if?: Dynamic<boolean>
    show?: Dynamic<boolean>
    disabled?: Dynamic<boolean>
    /** Dynamically mark a field as required and update its validation. */
    required?: Dynamic<boolean>
    /** Replace the field's validation rules when a dependency changes. */
    rules?: Dynamic<ZodTypeAny | string | undefined>
    componentProps?: Dynamic<Record<string, unknown>>
    /** Called after the field receives a user value. */
    onChange?: (
        value: unknown,
        context: FormFieldContext,
    ) => void | Promise<void>
}

export interface FormApiState {
    values: Record<string, unknown>
    errors: Record<string, string>
    isSubmitting: boolean
    loading: boolean
    disabled: boolean
}

export type FormSubmitHandler = (
    values: Record<string, unknown>,
) => void | Promise<void>

export interface FormRuntimeProps {
    disabled?: boolean
    loading?: boolean
    showDefaultActions?: boolean
    layout?: 'horizontal' | 'vertical'
    /** Use the compact spacing contract required by inline query forms. */
    compact?: boolean
    wrapperClass?: string
    handleSubmit?: FormSubmitHandler
}

export interface FormApiLike {
    readonly errors: Ref<Record<string, string>>
    readonly values: ComputedRef<Record<string, unknown>>
    readonly schema: FormFieldSchema[]
    readonly props: FormRuntimeProps
    readonly isSubmitting: boolean
    readonly loading: boolean
    readonly disabled: boolean
    getValues(fields?: string[], shouldValidate?: boolean): Promise<Record<string, unknown>>
    getRawValues(): Promise<Record<string, unknown>>
    getValueSnapshot(): Promise<{ rawValues: Record<string, unknown>; values: Record<string, unknown> }>
    getLatestSubmissionValues(): Record<string, unknown>
    setValues(
        fields: Record<string, unknown>,
        filterFields?: boolean,
        shouldValidate?: boolean,
    ): Promise<void>
    setFieldValue(field: string, value: unknown): boolean
    /** Set or clear a renderer-owned custom component error. */
    setFieldError(field: string, message?: string): void
    resetForm(): boolean
    resetFields(fields?: string[]): void
    validate(): Promise<{ valid: boolean; errors: Record<string, string> }>
    validateField(name: string): Promise<{ valid: boolean }>
    clearValid(): void
    submitForm(event?: Event): Promise<Record<string, unknown> | null>
    validateAndSubmit(): Promise<Record<string, unknown> | null>
    updateSchema(schema: Array<Partial<FormFieldSchema> & Pick<FormFieldSchema, 'fieldName'>>): void
    resetSchema(schema: FormFieldSchema[]): void
    appendSchemaByField(schema: FormFieldSchema, afterField?: string): void
    removeSchemaByField(fieldName: string): void
    setProps(props: Partial<FormRuntimeProps>): void
    scrollToField(fieldName: string): void
    getState(): FormApiState
}
