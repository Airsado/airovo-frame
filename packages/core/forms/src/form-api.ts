/**
 * FormApi — v5-aligned form controller.
 *
 * Wraps a vee-validate form context (provided by `mount()`) and
 * exposes a clean CRUD + validation API. The `errors` Ref mirrors
 * the raw vee-validate errors so templates can react to them without
 * writing a watch themselves.
 *
 * Lifecycle:
 *   1. `const api = new FormApi({ schema, validation, initialValues })`
 *   2. `api.mount(formContext)`   — connect to vee-validate's useForm return
 *   3. Use the API (setValues / getValues / setFieldValue / resetForm / validate)
 *   4. `api.unmount()`            — tear down the errors mirror watch
 */
import { ref, watch, type Ref } from 'vue'
import type { ZodTypeAny } from 'zod'
import type { FormFieldSchema, FormApiLike } from './types'

/** vee-validate form context — the minimum surface this class reads. */
interface FormContext {
    values: any
    errors: any
    validate(): Promise<{ valid: boolean; errors?: Record<string, any> }>
    validateField(name: string): Promise<{ valid: boolean }>
    setFieldValue(name: string, value: any): void
    setValues(values: Record<string, any>): void
    resetForm(): void
}

export interface FormApiOptions {
    schema?: FormFieldSchema[]
    validation?: ZodTypeAny
    initialValues?: Record<string, any>
}

export class FormApi implements FormApiLike {
    // ── Public reactive state ──
    /** Reactive mirror of the form-level errors. */
    public readonly errors: Ref<Record<string, string>> = ref({})

    // ── Public config (read-only after construction) ──
    public readonly schema: FormFieldSchema[]
    public readonly validation: ZodTypeAny | undefined
    public readonly initialValues: Record<string, any>

    // ── Internal vee-validate context (set by mount()) ──
    private form: FormContext | null = null
    private stopWatch: (() => void) | null = null

    constructor(options: FormApiOptions = {}) {
        this.schema = options.schema ?? []
        this.validation = options.validation
        this.initialValues = options.initialValues ?? {}
    }

    // ── Lifecycle ──

    /** Connect to a vee-validate form context (usually from `useForm()`). */
    mount(form: FormContext): void {
        this.form = form
        // Mirror the raw vee-validate errors (a ComputedRef nested in
        // a non-reactive wrapper) into our exposed Ref so consumers
        // can react to it via Vue's reactivity. We unwrap defensively
        // because the wrapper may arrive as a Ref or a plain object
        // depending on the vee-validate version / build flags.
        this.stopWatch?.()
        this.stopWatch = watch(
            () => {
                const errs = (form as any)?.errors
                if (!errs) return {}
                return ('value' in errs ? errs.value : errs) ?? {}
            },
            (v) => { this.errors.value = { ...(v ?? {}) } },
            { immediate: true, deep: true },
        )
    }

    /** Disconnect the form context and clear errors. */
    unmount(): void {
        this.stopWatch?.()
        this.stopWatch = null
        this.form = null
        this.errors.value = {}
    }

    // ── FormApiLike implementation ──

    async setValues(
        fields: Record<string, unknown>,
        filterFields: boolean = true,
        shouldValidate: boolean = false,
    ): Promise<void> {
        if (!this.form) return
        const payload = filterFields
            ? this.filterToSchema(fields)
            : { ...fields }
        this.form.setValues(payload)
        if (shouldValidate) await this.validate()
    }

    async getValues(
        fields?: string[],
        shouldValidate: boolean = false,
    ): Promise<Record<string, unknown>> {
        if (!this.form) return {}
        if (shouldValidate) await this.validate()
        const raw = this.form.values
        const value = raw && typeof raw === 'object' && 'value' in raw ? raw.value : raw
        if (fields?.length) {
            const out: Record<string, unknown> = {}
            for (const f of fields) out[f] = value?.[f]
            return out
        }
        return { ...(value ?? {}) }
    }

    setFieldValue(field: string, value: unknown): boolean {
        if (!this.form) return false
        this.form.setFieldValue(field, value)
        return true
    }

    resetForm(): boolean {
        if (!this.form) return false
        this.form.resetForm()
        this.errors.value = {}
        return true
    }

    // ── Extended v5 surface (not in FormApiLike but commonly needed) ──

    /** Run schema-level validation. Updates the errors Ref. */
    async validate(): Promise<{ valid: boolean; errors: Record<string, any> }> {
        if (!this.form) return { valid: true, errors: {} }
        const result = await this.form.validate()
        return { valid: result.valid, errors: (result as any).errors ?? {} }
    }

    /** Run a single field's rules. */
    async validateField(name: string): Promise<{ valid: boolean }> {
        if (!this.form) return { valid: true }
        return await this.form.validateField(name)
    }

    /** Clear all field errors without resetting values. */
    clearValid(): void {
        this.form?.resetForm?.({ values: undefined })
        this.errors.value = {}
    }

    /**
     * Validate then run the user submit handler with the values.
     * Returns the values on success, or `null` on validation failure
     * (with the errors map populated).
     */
    async submitForm(
        onSubmit?: (values: Record<string, any>) => Promise<void> | void,
    ): Promise<Record<string, any> | null> {
        const result = await this.validate()
        if (!result.valid) return null
        const values = await this.getValues()
        if (onSubmit) await onSubmit(values)
        return values
    }

    // ── Private helpers ──

    /** Filter `fields` down to only the names declared in the schema. */
    private filterToSchema(fields: Record<string, unknown>): Record<string, unknown> {
        const allowed = new Set(this.schema.map((s) => s.fieldName))
        const out: Record<string, unknown> = {}
        for (const key of Object.keys(fields)) {
            if (allowed.has(key)) out[key] = fields[key]
        }
        return out
    }
}

/** Re-export the interface for convenience. */
export type { FormApiLike } from './types'
