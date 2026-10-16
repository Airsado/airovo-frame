import type { FormFieldContext, FormFieldSchema } from './types'

const DATE_COMPONENTS = new Set([
    'DatePicker',
    'date',
    'DateTimePicker',
    'datetime',
])

/**
 * DatePickerField uses `undefined` for an empty model value. Keep that
 * contract when a date alias has no explicit default while preserving the
 * existing empty-string fallback for other form fields.
 */
export function isDateFieldComponent(component: FormFieldSchema['component']): boolean {
    return typeof component === 'string' && DATE_COMPONENTS.has(component)
}

export function resolveFieldDefault(
    item: FormFieldSchema,
    context: FormFieldContext,
): unknown {
    const value = typeof item.defaultValue === 'function'
        ? item.defaultValue(context)
        : item.defaultValue
    return value ?? (isDateFieldComponent(item.component) ? undefined : '')
}
