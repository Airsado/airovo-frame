import type { Component } from 'vue'
import type { ZodTypeAny } from 'zod'

// ── Built-in component names ──

export type BuiltInFormComponent =
    | 'Input'
    | 'Password'
    | 'Number'
    | 'Email'
    | 'Textarea'
    | 'Select'
    | 'Switch'
    | 'DatePicker'

/** Maps component names to actual Vue components. */
export type FormComponentMap = Partial<Record<BuiltInFormComponent, Component>> & {
    [key: string]: Component
}

// ── Field dependencies ──

export interface FormFieldDependencies {
    /** Which field values trigger re-evaluation. */
    triggerFields: string[]
    /** Return dynamic component props based on current form values. */
    componentProps?: (values: Record<string, any>, api: FormApiLike) => Record<string, any>
    /** Return whether this field should be disabled. */
    disabled?: (values: Record<string, any>, api: FormApiLike) => boolean
    /** Return whether this field should be hidden (v-if, DOM removed). */
    hidden?: (values: Record<string, any>, api: FormApiLike) => boolean
    /** Return whether this field should be required. */
    required?: (values: Record<string, any>, api: FormApiLike) => boolean
}

// ── Field schema ──

export interface FormFieldSchema {
    fieldName: string
    label?: string
    /** Component name (from componentMap) or a custom Component. */
    component?: BuiltInFormComponent | Component
    componentProps?: Record<string, any>
    defaultValue?: any
    /** Field-level zod rule (overrides schema-level validation for this field). */
    rules?: ZodTypeAny
    description?: string
    dependencies?: FormFieldDependencies
    hidden?: boolean
    disabled?: boolean
    required?: boolean
}

// ── Form layout ──

export type FormLayout = 'horizontal' | 'vertical'

// ── Grid wrapper class ──

export type FormWrapperClass =
    | 'grid-cols-1'
    | 'grid-cols-2'
    | 'grid-cols-3'
    | 'grid-cols-4'
    | (string & {})

// ── Form props ──

export interface FormProps {
    /** Ordered field definitions. */
    schema: FormFieldSchema[]
    /** Global zod schema. Field-level `rules` take precedence. */
    validation?: ZodTypeAny
    layout?: FormLayout
    /** Tailwind grid class for the field wrapper. Default: 'grid-cols-1'. */
    wrapperClass?: FormWrapperClass
    /** Enable collapsible mode (fields beyond `collapsedRows` are hidden by default). */
    collapsible?: boolean
    /** Number of rows visible when collapsed. Default: 1. */
    collapsedRows?: number
    /** Show built-in submit + reset buttons. */
    showDefaultActions?: boolean
    submitButtonText?: string
    resetButtonText?: string
    /** Called on successful submit (after validation passes). */
    handleSubmit?: (values: Record<string, any>) => Promise<void> | void
    /** Called on reset. */
    handleReset?: (values: Record<string, any>) => Promise<void> | void
}

// ── FormApi minimal interface (used by dependencies callbacks) ──

export interface FormApiLike {
    getValues<T = Record<string, any>>(): T
    setFieldValue(name: string, value: any): void
    setValues(fields: Record<string, any>): void
    validate(): Promise<{ valid: boolean; errors: Record<string, any> }>
    resetForm(): void
}
