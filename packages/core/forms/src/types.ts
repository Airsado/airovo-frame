import type { Component, Ref } from 'vue'
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
    | 'Checkbox'
    | 'RadioGroup'
    | 'TimePicker'

/** Maps component names to actual Vue components. */
export type FormComponentMap = Partial<Record<BuiltInFormComponent, Component>> & {
    [key: string]: Component
}

// ── Field schema (v5-aligned) ──
//
// Each dynamic prop accepts a function (values, api) => result. The
// `values` arg is the current form values snapshot; `api` is the
// FormApi instance for reading form-level state.

export interface FormFieldSchema {
    /** Unique field name (key in the form model). */
    fieldName: string
    /** Label shown next to the input. */
    label?: string
    /** Component name (from componentMap) or a direct Component. */
    component?: BuiltInFormComponent | Component
    /**
     * Component props — either a static object, or a function that
     * returns one based on the current form values + api. The
     * function form is the v5 "dynamic componentProps" pattern.
     */
    componentProps?: Record<string, any> | ((ctx: FieldContext) => Record<string, any>)
    /** Initial value — static or computed from the current model. */
    defaultValue?: any | ((ctx: FieldContext) => any)
    /**
     * Visibility — true to show, false to hide. Function form
     * re-evaluates whenever any tracked field's value changes.
     */
    show?: boolean | ((ctx: FieldContext) => boolean)
    /** Disabled state — true to disable. Function form supported. */
    disabled?: boolean | ((ctx: FieldContext) => boolean)
    /** Whether the field must have a non-empty value (UI hint; rules take precedence). */
    required?: boolean
    /** Field-level zod rule (overrides schema-level validation for this field). */
    rules?: ZodTypeAny
    description?: string
    /** Grid column config for this field (v5 `colProps`). */
    colProps?: { span?: number; offset?: number }
    /** Optional help text (v5 `helpMessage`). */
    helpMessage?: string
    /** Place a custom slot in the form. The slot receives `ctx`. */
    slot?: string
}

// ── Field context (passed to schema functions) ──

export interface FieldContext {
    /** Current form values snapshot. */
    values: Record<string, any>
    /** The FormApi instance for this form. */
    api: FormApiLike
}

// ── Form-level props ──
//
// Top-level form layout. The `colProps` on each field override the
// `baseColProps` here. Default base layout is 1 column (full width).

export type FormLayout = 'horizontal' | 'vertical'

export type FormWrapperClass =
    | 'grid-cols-1'
    | 'grid-cols-2'
    | 'grid-cols-3'
    | 'grid-cols-4'
    | (string & {})

export interface FormProps {
    /** Ordered field definitions. */
    schema: FormFieldSchema[]
    /** Global zod schema. Field-level `rules` take precedence. */
    validation?: ZodTypeAny
    layout?: FormLayout
    /** Tailwind grid class for the field wrapper. Default: 'grid-cols-1'. */
    wrapperClass?: FormWrapperClass
    /** Default column props for all fields (per-field `colProps` overrides). */
    baseColProps?: { span?: number }
    /** Enable collapsible mode (fields beyond `collapsedRows` are hidden by default). */
    collapsible?: boolean
    /** Number of rows visible when collapsed. Default: 1. */
    collapsedRows?: number
    /** Show built-in submit + reset buttons. */
    showDefaultActions?: boolean
    submitButtonText?: string
    resetButtonText?: string
    /** Label width (v5 parity). */
    labelWidth?: number | string
    /** Called on successful submit (after validation passes). */
    handleSubmit?: (values: Record<string, any>) => Promise<void> | void
    /** Called on reset. */
    handleReset?: (values: Record<string, any>) => Promise<void> | void
}

// ── FormApiLike — the public surface other code can depend on ──
//
// Mirrors v5's FormActionType. The full FormApi (in form-api.ts)
// extends this with the reactive `errors: Ref<Record<string, string>>`.

export interface FormApiLike {
    // ── Values ──
    getValues<T = Record<string, any>>(): T
    setValues(fields: Record<string, any>): void
    setFieldValue(name: string, value: any): void

    // ── Validation ──
    validate(): Promise<{ valid: boolean; errors: Record<string, any> }>
    validateField(name: string): Promise<{ valid: boolean }>
    /** Clear all field errors. */
    clearValid(): void

    // ── Reset ──
    resetForm(): void
    /** Reset specific fields. */
    resetFields(names?: string[]): void

    // ── Schema mutations (v5) ──
    updateSchema(updates: Partial<FormFieldSchema>[]): void
    resetSchema(schema: FormFieldSchema[]): void
    appendSchemaByField(schema: Partial<FormFieldSchema>, afterField?: string): void
    removeSchemaByField(name: string): void

    // ── Props (v5 `setProps`) ──
    setProps(props: Partial<FormProps>): void

    // ── UX (v5) ──
    scrollToField(name: string): void

    // ── Reactive errors (ref) ──
    readonly errors: Ref<Record<string, string>>
}
