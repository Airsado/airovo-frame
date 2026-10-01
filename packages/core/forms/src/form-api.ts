import { computed, ref, shallowReactive, shallowRef, watch, type Ref } from 'vue'
import type { FormContext } from 'vee-validate'
import type { ZodTypeAny } from 'zod'
import type {
    FormApiLike,
    FormApiState,
    FormFieldSchema,
    FormRuntimeProps,
} from './types'

export interface FormApiOptions extends FormRuntimeProps {
    schema?: FormFieldSchema[]
    validation?: ZodTypeAny
    initialValues?: Record<string, unknown>
}

type FormContextLike = FormContext

function unwrap<T>(value: T | Ref<T>): T {
    return value && typeof value === 'object' && 'value' in value
        ? value.value
        : value
}

function isRecord(value: unknown): value is Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false
    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
}

function cloneValue<T>(value: T): T {
    if (value === undefined || value === null) return value
    if (typeof structuredClone === 'function') {
        try {
            return structuredClone(value)
        } catch {
            // Fall through for values that are not structured-cloneable.
        }
    }
    if (Array.isArray(value)) return value.map((item) => cloneValue(item)) as T
    if (isRecord(value)) {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, cloneValue(item)]),
        ) as T
    }
    return value
}

function normalizedFieldPath(fieldName: string, parentPath = ''): string {
    if (fieldName.startsWith('[') && fieldName.endsWith(']')) return fieldName.slice(1, -1)
    return parentPath ? `${parentPath}.${fieldName}` : fieldName
}

function pathSegments(path: string): string[] {
    return path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
}

function readValueAtPath(value: unknown, path: string): unknown {
    return pathSegments(path).reduce<unknown>((current, segment) => (
        current && typeof current === 'object'
            ? (current as Record<string, unknown>)[segment]
            : undefined
    ), value)
}

function deleteValueAtPath(target: unknown, path: string): void {
    const segments = pathSegments(path)
    if (!segments.length || !target || typeof target !== 'object') return
    let current = target as Record<string, unknown>
    for (const segment of segments.slice(0, -1)) {
        const next = current[segment]
        if (!next || typeof next !== 'object') return
        current = next as Record<string, unknown>
    }
    delete current[segments.at(-1)!]
}

function collectFieldPaths(schema: FormFieldSchema[], parentPath = '', paths = new Set<string>()): Set<string> {
    for (const field of schema) {
        const path = normalizedFieldPath(field.fieldName, parentPath)
        paths.add(path)
        const children = (field as FormFieldSchema & { children?: FormFieldSchema[] }).children
        if (children?.length) collectFieldPaths(children, path, paths)
    }
    return paths
}

function collectSchemaNames(schema: FormFieldSchema[], parentPath = '', names = new Set<string>()): Set<string> {
    for (const field of schema) {
        const path = normalizedFieldPath(field.fieldName, parentPath)
        names.add(path)
        if (field.children?.length) collectSchemaNames(field.children, path, names)
    }
    return names
}

function updateSchemaField(
    schema: FormFieldSchema[],
    update: Partial<FormFieldSchema> & Pick<FormFieldSchema, 'fieldName'>,
    parentPath = '',
): boolean {
    const index = schema.findIndex((field) => (
        field.fieldName === update.fieldName
        || normalizedFieldPath(field.fieldName, parentPath) === update.fieldName
    ))
    if (index !== -1) {
        schema[index] = { ...schema[index], ...update }
        return true
    }
    return schema.some((field) => field.children?.length && updateSchemaField(
        field.children,
        update,
        normalizedFieldPath(field.fieldName, parentPath),
    ))
}

function appendSchemaField(schema: FormFieldSchema[], field: FormFieldSchema, afterField?: string, parentPath = ''): boolean {
    if (!afterField) {
        schema.push(field)
        return true
    }
    const index = schema.findIndex((item) => (
        item.fieldName === afterField
        || normalizedFieldPath(item.fieldName, parentPath) === afterField
    ))
    if (index !== -1) {
        schema.splice(index + 1, 0, field)
        return true
    }
    return schema.some((item) => item.children?.length && appendSchemaField(
        item.children,
        field,
        afterField,
        normalizedFieldPath(item.fieldName, parentPath),
    ))
}

function removeSchemaField(schema: FormFieldSchema[], fieldName: string, parentPath = ''): boolean {
    const index = schema.findIndex((field) => (
        field.fieldName === fieldName
        || normalizedFieldPath(field.fieldName, parentPath) === fieldName
    ))
    if (index !== -1) {
        schema.splice(index, 1)
        return true
    }
    return schema.some((field) => field.children?.length && removeSchemaField(
        field.children,
        fieldName,
        normalizedFieldPath(field.fieldName, parentPath),
    ))
}

function hasKnownDescendant(path: string, knownPaths: Set<string>): boolean {
    const prefix = path ? `${path}.` : ''
    return [...knownPaths].some((known) => known.startsWith(prefix))
}

/**
 * Filter a nested patch against the form schema while preserving known
 * siblings already present in the live form. Vben's form controller treats
 * nested object updates as patches; vee-validate's setValues replaces an
 * object branch, so the merge has to happen before delegating to it.
 */
function mergeKnownPatch(
    input: unknown,
    current: unknown,
    basePath: string,
    knownPaths: Set<string>,
): unknown {
    if (Array.isArray(input)) {
        const currentRows = Array.isArray(current) ? current : []
        return input.map((row, index) => mergeKnownPatch(row, currentRows[index], basePath, knownPaths))
    }
    if (!isRecord(input)) return input

    const output: Record<string, unknown> = {}
    const currentRecord = isRecord(current) ? current : {}
    const keys = new Set(Object.keys(input))
    // Once inside a known object branch, retain known sibling values that the
    // caller did not include in this patch.
    if (basePath) {
        for (const key of Object.keys(currentRecord)) keys.add(key)
    }
    for (const key of keys) {
        const path = basePath ? `${basePath}.${key}` : key
        const hasInput = Object.hasOwn(input, key)
        const value = hasInput ? input[key] : currentRecord[key]
        // A field can be both a valid leaf and the parent of child schemas
        // (most notably an array field with `children`).  In that case the
        // child paths must still be filtered row by row.
        if (knownPaths.has(path) && !hasKnownDescendant(path, knownPaths)) {
            output[key] = value
        } else if (hasKnownDescendant(path, knownPaths) && (isRecord(value) || Array.isArray(value))) {
            output[key] = mergeKnownPatch(value, currentRecord[key], path, knownPaths)
        }
    }
    return output
}

export class FormApi implements FormApiLike {
    public readonly errors = ref<Record<string, string>>({})
    private readonly formRef = shallowRef<FormContextLike | null>(null)
    public readonly values = computed<Record<string, unknown>>(() => {
        const values = this.formRef.value ? unwrap(this.formRef.value.values) : {}
        return { ...(values ?? {}) }
    })
    public readonly schema: FormFieldSchema[]
    public readonly props: FormRuntimeProps
    public readonly initialValues: Record<string, unknown>
    public readonly validation?: ZodTypeAny
    public form: FormContextLike | null = null

    private stopWatch: (() => void) | null = null
    private readonly submitting = ref(false)
    private submission: Promise<Record<string, unknown> | null> | null = null
    private latestSubmissionValues: Record<string, unknown> = {}

    constructor(options: FormApiOptions = {}) {
        this.schema = shallowReactive([...(options.schema ?? [])])
        this.props = shallowReactive<FormRuntimeProps>({
            // Preserve the established form presentation; callers can opt
            // into stacked fields with `layout: 'vertical'`.
            layout: options.layout ?? 'horizontal',
            showDefaultActions: options.showDefaultActions ?? true,
            disabled: options.disabled ?? false,
            loading: options.loading ?? false,
            wrapperClass: options.wrapperClass,
            handleSubmit: options.handleSubmit,
        })
        this.initialValues = { ...(options.initialValues ?? {}) }
        this.validation = options.validation
    }

    mount(form: FormContextLike): void {
        this.unmount()
        this.form = form
        this.formRef.value = form
        this.stopWatch = watch(
            () => unwrap(form.errors),
            (value) => {
                this.errors.value = { ...(value ?? {}) } as Record<string, string>
            },
            { immediate: true, deep: true },
        )
    }

    unmount(): void {
        this.stopWatch?.()
        this.stopWatch = null
        this.form = null
        this.formRef.value = null
    }

    get isSubmitting(): boolean {
        return this.submitting.value || Boolean(unwrap(this.form?.isSubmitting ?? false))
    }

    get loading(): boolean {
        return this.isSubmitting || Boolean(this.props.loading)
    }

    get disabled(): boolean {
        return Boolean(this.props.disabled)
    }

    async getValues(
        fields?: string[],
        shouldValidate = false,
    ): Promise<Record<string, unknown>> {
        if (shouldValidate) await this.validate()
        const record = this.values.value
        if (!fields?.length) return cloneValue({ ...record })
        return cloneValue(Object.fromEntries(fields.map((field) => [field, readValueAtPath(record, field)])))
    }

    async getRawValues(): Promise<Record<string, unknown>> {
        return cloneValue(this.form ? unwrap(this.form.values) : {})
    }

    async getValueSnapshot(): Promise<{
        rawValues: Record<string, unknown>
        values: Record<string, unknown>
    }> {
        const rawValues = await this.getRawValues()
        return {
            rawValues,
            values: cloneValue(rawValues),
        }
    }

    getLatestSubmissionValues(): Record<string, unknown> {
        return cloneValue(this.latestSubmissionValues)
    }

    async setValues(
        fields: Record<string, unknown>,
        filterFields = true,
        shouldValidate = false,
    ): Promise<void> {
        if (!this.form) return
        const values = filterFields
            ? mergeKnownPatch(fields, this.values.value, '', collectFieldPaths(this.schema)) as Record<string, unknown>
            : { ...fields }
        this.form.setValues(values, shouldValidate)
        if (shouldValidate) await this.validate()
    }

    setFieldValue(field: string, value: unknown): boolean {
        if (!this.form) return false
        this.form.setFieldValue(field, value, false)
        return true
    }

    resetForm(): boolean {
        if (!this.form) return false
        this.form.resetForm({ values: this.initialValues })
        this.errors.value = {}
        this.latestSubmissionValues = {}
        return true
    }

    resetFields(fields?: string[]): void {
        if (!this.form) return
        if (!fields?.length) {
            this.resetForm()
            return
        }
        for (const field of fields) {
            this.form.setFieldValue(field, readValueAtPath(this.initialValues, field), false)
            this.form.setFieldError?.(field, undefined)
        }
        const nextErrors = { ...this.errors.value }
        fields.forEach((field) => delete nextErrors[field])
        this.errors.value = nextErrors
    }

    async validate(): Promise<{ valid: boolean; errors: Record<string, string> }> {
        if (!this.form) return { valid: true, errors: {} }
        const result = await this.form.validate()
        const errors = (result.errors ?? {}) as Record<string, string>
        this.errors.value = { ...errors }
        return { valid: result.valid, errors }
    }

    async validateField(name: string): Promise<{ valid: boolean }> {
        if (!this.form) return { valid: true }
        const schema = this.schema.find((field) => field.fieldName === name)
        const fieldValue = readValueAtPath(this.values.value, name)
        const paths = schema && Array.isArray(fieldValue)
            ? schema.children?.length
                ? fieldValue.flatMap((_, index) => schema.children!.map((child) => `${name}[${index}].${child.fieldName}`))
                : fieldValue.map((_, index) => `${name}[${index}].${schema.ArrayField ?? 'value'}`)
            : [name]
        const results = await Promise.all(paths.map(async (path) => ({
            path,
            result: await this.form!.validateField(path),
        })))
        const next = {
            ...this.errors.value,
            ...(unwrap(this.form.errors) as Record<string, string>),
        }
        for (const { path, result } of results) {
            delete next[path]
            if (result.errors?.[0]) next[path] = result.errors[0]
        }
        this.errors.value = next
        return { valid: results.every(({ result }) => result.valid) }
    }

    clearValid(): void {
        this.form?.setErrors({})
        this.errors.value = {}
    }

    submitForm(event?: Event): Promise<Record<string, unknown> | null> {
        event?.preventDefault()
        event?.stopPropagation()
        if (!this.form) return Promise.resolve(null)
        if (this.submission) return this.submission
        this.submission = (async () => {
            this.submitting.value = true
            try {
                const result = await this.validate()
                if (!result.valid) {
                    const firstError = Object.keys(result.errors)[0]
                    if (firstError) this.scrollToField(firstError)
                    return null
                }
                const values = await this.getValues()
                this.latestSubmissionValues = cloneValue(values)
                await this.props.handleSubmit?.(values)
                return values
            } finally {
                this.submitting.value = false
                this.submission = null
            }
        })()
        return this.submission
    }

    validateAndSubmit(): Promise<Record<string, unknown> | null> {
        return this.submitForm()
    }

    updateSchema(updates: Array<Partial<FormFieldSchema> & Pick<FormFieldSchema, 'fieldName'>>): void {
        for (const update of updates) {
            if (!updateSchemaField(this.schema, update)) {
                this.schema.push({
                    label: update.fieldName,
                    component: 'Input',
                    ...update,
                } as FormFieldSchema)
            }
        }
    }

    resetSchema(schema: FormFieldSchema[]): void {
        const names = collectSchemaNames(schema)
        for (const fieldName of collectSchemaNames(this.schema)) {
            if (!names.has(fieldName)) this.clearField(fieldName)
        }
        this.schema.splice(0, this.schema.length, ...schema)
    }

    appendSchemaByField(schema: FormFieldSchema, afterField?: string): void {
        if (!appendSchemaField(this.schema, schema, afterField)) this.schema.push(schema)
    }

    removeSchemaByField(fieldName: string): void {
        if (removeSchemaField(this.schema, fieldName)) {
            this.clearField(fieldName)
        }
    }

    private clearField(fieldName: string): void {
        if (this.form) {
            deleteValueAtPath(unwrap(this.form.values), fieldName)
            this.form.setFieldError?.(fieldName, undefined)
        }
        delete this.initialValues[fieldName]
        const next = { ...this.errors.value }
        for (const key of Object.keys(next)) {
            if (key === fieldName || key.startsWith(`${fieldName}[`)) delete next[key]
        }
        this.errors.value = next
    }

    setProps(props: Partial<FormRuntimeProps>): void {
        Object.assign(this.props, props)
    }

    scrollToField(fieldName: string): void {
        if (typeof document === 'undefined') return
        const element = Array.from(document.querySelectorAll<HTMLElement>('[name]'))
            .find((field) => field.getAttribute('name') === fieldName)
            ?? document.getElementById(`AForm-${fieldName}-0`)
        element?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
        element?.focus?.()
    }

    getState(): FormApiState {
        const values = this.form ? unwrap(this.form.values) : {}
        return {
            values: { ...(values as Record<string, unknown>) },
            errors: { ...this.errors.value },
            isSubmitting: this.isSubmitting,
            loading: this.loading,
            disabled: this.disabled,
        }
    }
}

export type { FormApiLike } from './types'
