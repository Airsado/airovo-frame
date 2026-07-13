import { ref, watch, type Ref } from 'vue'
import type { FormFieldSchema, FormProps } from './types'

/**
 * FormApi — manages form state, values, validation, and dynamic schema.
 *
 * Created by `useAForm()`, mounted into `<AForm>` via `provide`/`inject`.
 * The component calls `mount(form, schema)` in `onMounted`.
 */
export class FormApi {
    /** vee-validate form context — available after mount(). Stores raw vee-validate return. */
    form: Record<string, any> | null = null

    /**
     * Reactive mirror of the form-level errors. Updated by the watch
     * inside `mount()`. The raw `form.errors` from vee-validate is a
     * ComputedRef nested inside a non-reactive wrapper, so we surface
     * a proper Vue Ref here so consumers (AForm, etc.) can react to
     * it without writing a watch themselves.
     */
    public readonly errors: Ref<Record<string, string>> = ref({})

    /** Current field definitions. */
    schema: FormFieldSchema[] = []

    /** Raw values snapshot (updated after each submit). */
    private latestSubmissionValues: Record<string, any> = {}

    private state: FormProps

    constructor(options: FormProps) {
        // Avoid duplicating `schema` (it is part of `options`); spread defaults first
        // and let the caller-supplied options override.
        this.state = {
            showDefaultActions: true,
            wrapperClass: 'grid-cols-1',
            ...options,
        } as FormProps
        this.schema = [...(this.state.schema ?? options.schema)]
    }

    // ── Lifecycle ──

    /** Called by AForm onMounted. */
    mount(form: Record<string, any>): void {
        this.form = form

        // Sync the raw vee-validate errors (a ComputedRef nested in
        // a non-reactive wrapper) into our exposed Ref so consumers
        // can react to it via Vue's reactivity. We unwrap defensively
        // because the wrapper may arrive as a Ref or a plain object
        // depending on the vee-validate version / build flags.
        watch(
            () => {
                const errs = (form as any)?.errors
                if (!errs) return {}
                return ('value' in errs ? errs.value : errs) ?? {}
            },
            (v) => { this.errors.value = { ...(v ?? {}) } },
            { immediate: true, deep: true },
        )
    }

    /** Called by AForm onUnmounted. */
    unmount(): void {
        this.form?.resetForm()
        this.form = null
    }

    // ── Values ──

    /** Get current form values. */
    getValues<T = Record<string, any>>(): T {
        if (!this.form) return {} as T
        return { ...this.form.values } as T
    }

    /** Set multiple field values. Only updates fields that exist in schema. */
    setValues(fields: Record<string, any>): void {
        if (!this.form) return
        const schemaNames = new Set(this.schema.map((f) => f.fieldName))
        const filtered: Record<string, any> = {}
        for (const key of Object.keys(fields)) {
            if (schemaNames.has(key)) filtered[key] = fields[key]
        }
        this.form.setValues(filtered)
    }

    /** Set a single field value. */
    setFieldValue(name: string, value: any): void {
        if (!this.form) return
        this.form.setFieldValue(name, value)
    }

    // ── Validation ──

    /** Validate all fields. */
    async validate(): Promise<{ valid: boolean; errors: Record<string, any> }> {
        if (!this.form) return { valid: true, errors: {} }
        return await this.form.validate()
    }

    /** Validate a single field. Triggers vee-validate to populate errors. */
    async validateField(name: string): Promise<{ valid: boolean }> {
        if (!this.form) return { valid: true }
        const result = await this.form.validateField(name)
        return { valid: result.valid }
    }

    // ── Submit / Reset ──

    /** Validate then submit. Calls state.handleSubmit on success. */
    async submitForm(e?: Event): Promise<Record<string, any>> {
        e?.preventDefault()
        e?.stopPropagation()

        if (!this.form) return {}

        const { valid } = await this.form.validate()
        if (!valid) return {}

        const values = this.getValues()
        this.latestSubmissionValues = { ...values }

        await this.state.handleSubmit?.(values)
        return values
    }

    /** Reset form to initial values. Calls state.handleReset. */
    async resetForm(): Promise<void> {
        if (!this.form) return
        this.form.resetForm()
        const values = this.getValues()
        await this.state.handleReset?.(values)
    }

    // ── Schema manipulation ──

    /** Replace the entire schema. Useful for dynamic forms. */
    setSchema(schema: FormFieldSchema[]): void {
        this.schema = [...schema]
    }

    /** Update existing fields by fieldName. Merges properties. */
    updateSchema(updates: Partial<FormFieldSchema>[]): void {
        const updatedMap = new Map(updates.map((u) => [u.fieldName!, u]))
        this.schema = this.schema.map((field) => {
            const update = updatedMap.get(field.fieldName)
            return update ? { ...field, ...update } : field
        })
    }

    /** Remove fields by name. */
    removeSchemaByFields(fields: string[]): void {
        const set = new Set(fields)
        this.schema = this.schema.filter((f) => !set.has(f.fieldName))
    }

    /** Get the most recent submission values. */
    getLatestSubmissionValues(): Record<string, any> {
        return { ...this.latestSubmissionValues }
    }
}
