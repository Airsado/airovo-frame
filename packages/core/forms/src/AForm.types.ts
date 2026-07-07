/**
 * AForm component types and interfaces.
 *
 * Kept in a separate `.ts` file because Vue 3 `<script setup>` does not
 * allow ES exports (only certain inline `defineProps<T>()` generics).
 */

/**
 * Component kinds that AForm can render automatically.
 * Slots are always available for full overrides.
 */
export type AFormFieldComponent =
    | 'Input'
    | 'Password'
    | 'Number'
    | 'Email'
    | 'Textarea'

export interface AFormField {
    fieldName: string
    label?: string
    description?: string
    /** Auto-rendered component. Default: 'Input' */
    component?: AFormFieldComponent
    /** Props passed through to the rendered component */
    componentProps?: Record<string, unknown>
    defaultValue?: unknown
    disabled?: boolean
    /** Skip rendering entirely */
    hidden?: boolean
}

export interface AFormSchema {
    fields: AFormField[]
    initialValues?: Record<string, unknown>
}
