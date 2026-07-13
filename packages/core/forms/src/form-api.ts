import { ref, watch, type Ref } from 'vue'
import type { FormFieldSchema, FormProps, FormApiLike } from './types'

/**
 * FormApi — v5-aligned form controller.
 *
 * Holds the vee-validate form context, mirrors its errors into a
 * reactive Ref (so templates can react to validation results without
 * a manual watch), and exposes the full v5 FormActionType surface
 * (validate / clearValid / setProps / scrollToField / schema
 * mutations / etc.).
 */
export class FormApi implements FormApiLike {
    /** Raw vee-validate form context — null before `mount()`. */
    form: Record<string, any> | null = null

    /**
     * Reactive mirror of the form-level errors. Updated by the watch
     * inside `mount()`. Exposed as a Ref so consumers can read it
     * reactively without writing a watch themselves.
     */
    public readonly errors: Ref<Record<string, string>> = ref({})

    /** Current field definitions. */
    schema: FormFieldSchema[] = []

    /** Raw values snapshot (updated after each submit). */
    private latestSubmissionValues: Record<string, any> = {}

    /** Runtime form props (v5 `setProps` mutates this). */
    private runtimeProps: Partial<FormProps> = {}

    private state: FormProps

    constructor(options: FormProps) {
        this.state = {
            showDefaultActions: true,
            wrapperClass: 'grid-cols-1',
            ...options,
        } as FormProps
        this.schema = [...(this.state.schema ?? [])]
    }

    // ── Lifecycle ──

    /** Called by AForm onMounted. Wires the reactive errors mirror. */
    mount(form: Record<string, any>): void {
        this.form = form
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
        this.form?.resetForm?.()
        this.form = null
    }

    // ── Values ──

    getValues<T = Record<string, any>>(): T {
        if (!this.form) return {} as T
        // Unwrap the vee-validate values ref so the consumer gets a
        // plain object (not a Ref-like with .dep / __v_isRef).
        const raw = this.form.values
        const value = raw && typeof raw === 'object' && 'value' in raw ? raw.value : raw
        return { ...(value ?? {}) } as T
    }

    setValues(fields: Record<string, any>): void {
        if (!this.form) return
        const schemaNames = new Set(this.schema.map((f) => f.fieldName))
        const filtered: Record<string, any> = {}
        for (const key of Object.keys(fields)) {
            if (schemaNames.has(key)) filtered[key] = fields[key]
        }
        this.form.setValues(filtered)
    }

    setFieldValue(name: string, value: any): void {
        if (!this.form) return
        this.form.setFieldValue(name, value)
    }

    // ── Validation ──

    async validate(): Promise<{ valid: boolean; errors: Record<string, any> }> {
        if (!this.form) return { valid: true, errors: {} }
        return await this.form.validate()
    }

    async validateField(name: string): Promise<{ valid: boolean }> {
        if (!this.form) return { valid: true }
        const result = await this.form.validateField(name)
        return { valid: result.valid }
    }

    /**
     * Clear all field errors. v5 parity — useful when the user
     * resets the form or switches context.
     */
    clearValid(): void {
        this.form?.resetForm?.({ values: undefined })
        this.errors.value = {}
    }

    // ── Reset ──

    resetForm(): void {
        if (!this.form) return
        this.form.resetForm()
        this.errors.value = {}
    }

    /**
     * Reset specific fields (v5). If `names` is omitted, resets all.
     */
    resetFields(names?: string[]): void {
        if (!this.form) return
        if (names?.length) {
            for (const n of names) this.form.setFieldValue(n, undefined)
        } else {
            this.form.resetForm()
        }
    }

    // ── Schema mutations (v5) ──

    /**
     * Update existing field definitions in place. Each `updates` entry
     * is a partial schema keyed by `fieldName`. Unknown field names
     * are added as new fields (appended to the end).
     */
    updateSchema(updates: Partial<FormFieldSchema>[]): void {
        const map = new Map(updates.map((u) => [u.fieldName!, u]))
        const seen = new Set<string>()
        this.schema = this.schema.map((f) => {
            const u = map.get(f.fieldName)
            if (u) {
                seen.add(f.fieldName)
                return { ...f, ...u }
            }
            return f
        })
        // Append new fields
        for (const u of updates) {
            if (u.fieldName && !seen.has(u.fieldName)) {
                this.schema.push(u as FormFieldSchema)
            }
        }
    }

    /**
     * Replace the entire schema array. v5 parity.
     */
    resetSchema(schema: FormFieldSchema[]): void {
        this.schema = [...schema]
    }

    /**
     * Append a new field after an existing one. If `afterField` is
     * omitted, appends to the end of the array.
     */
    appendSchemaByField(schema: Partial<FormFieldSchema>, afterField?: string): void {
        const field: FormFieldSchema = { fieldName: '', ...schema } as FormFieldSchema
        if (!field.fieldName) return
        if (!afterField) {
            this.schema.push(field)
            return
        }
        const idx = this.schema.findIndex((f) => f.fieldName === afterField)
        if (idx === -1) {
            this.schema.push(field)
        } else {
            this.schema.splice(idx + 1, 0, field)
        }
    }

    /**
     * Remove a field by name. v5 parity.
     */
    removeSchemaByField(name: string): void {
        this.schema = this.schema.filter((f) => f.fieldName !== name)
    }

    // ── Props (v5 `setProps`) ──

    /**
     * Update the form's runtime props (labelWidth, showActionButtonGroup,
     * etc.). The change is reflected the next time AForm re-evaluates.
     */
    setProps(props: Partial<FormProps>): void {
        this.runtimeProps = { ...this.runtimeProps, ...props }
        // Surface the change to any consumer watching schema/runtime.
        // AForm picks these up via its own watch on the api.
    }

    getRuntimeProps(): Partial<FormProps> {
        return this.runtimeProps
    }

    // ── UX (v5) ──

    /**
     * Scroll the named field into view. v5 parity. Falls back to a
     * focus() + scrollIntoView() if the field element can be found.
     */
    scrollToField(name: string): void {
        if (typeof document === 'undefined') return
        const el = document.querySelector(`[id="${name}"]`) as HTMLElement | null
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            if (typeof (el as HTMLInputElement).focus === 'function') {
                (el as HTMLInputElement).focus()
            }
        }
    }

    // ── Submit ──

    async submitForm(e?: Event): Promise<Record<string, any>> {
        e?.preventDefault()
        e?.stopPropagation()
        if (!this.form) return {}

        const result = await this.form.validate()
        if (!result.valid) {
            // Scroll to the first field with an error (v5 UX).
            const firstError = Object.keys(result.errors ?? {})[0]
            if (firstError) this.scrollToField(firstError)
            return {}
        }

        const values = this.getValues()
        this.latestSubmissionValues = { ...values }
        await this.state.handleSubmit?.(values)
        return values
    }

    // ── Misc ──

    /** Get the most recent successful submission's values. */
    getLatestSubmissionValues(): Record<string, any> {
        return { ...this.latestSubmissionValues }
    }
}

// Re-export the public surface
export type { FormApiLike }
