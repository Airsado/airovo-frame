import { computed, type Ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import type { AFormField, AFormSchema as BaseFormSchema } from './AForm.types'

export type { AFormField, AFormFieldComponent } from './AForm.types'

/**
 * Form-level configuration with Zod validation.
 */
export interface AFormSchema extends BaseFormSchema {
    /** Zod schema used both for validation and type inference */
    validation: z.ZodType<unknown>
}

/**
 * Bound handlers returned by `useAForm`.
 */
export interface AFormBindings<T extends Record<string, unknown>> {
    values: Ref<T>
    errors: Readonly<Ref<Record<string, string | undefined>>>
    fieldList: Readonly<Ref<AFormField[]>>
    isSubmitting: Readonly<Ref<boolean>>
    isValid: Ref<boolean>
    meta: unknown
    handleSubmit: ReturnType<typeof useForm<T>>['handleSubmit']
    setField: (name: string, value: unknown) => void
    setValues: (values: Partial<T>) => void
    reset: (newValues?: Partial<T>) => void
    validate: () => Promise<void>
}

/**
 * useAForm - JSON-Schema-driven form composable.
 *
 * Combines `vee-validate` + `zod` into a single API. Returns reactive
 * `values` / `errors` that bind directly to `<AForm>` via v-model.
 *
 * @example
 * ```ts
 * import { z } from 'zod'
 * import { useAForm, AForm } from '@airovo/forms'
 *
 * const schema = {
 *   fields: [
 *     { fieldName: 'username', label: '用户名', componentProps: { placeholder: '请输入' } },
 *     { fieldName: 'password', label: '密码', component: 'Password' },
 *   ],
 *   validation: z.object({
 *     username: z.string().min(1, '请输入用户名'),
 *     password: z.string().min(1, '请输入密码'),
 *   }),
 *   initialValues: { username: '', password: '' },
 * }
 *
 * const { handleSubmit, values, errors } = useAForm(schema)
 *
 * const onSubmit = handleSubmit(async (data) => {
 *   console.log(data) // fully typed!
 * })
 * ```
 */
export function useAForm<T extends Record<string, unknown>>(
    schema: AFormSchema,
): AFormBindings<T> {
    const {
        handleSubmit,
        values,
        errors,
        setFieldValue,
        setValues,
        resetForm,
        validate,
        isSubmitting,
        isValid,
        meta,
    } = useForm<T>({
        validationSchema: toTypedSchema(schema.validation as z.ZodType<T>),
        initialValues: schema.initialValues as T,
    })

    const fieldList = computed(() => schema.fields.filter((f) => !f.hidden))

    function setField(name: string, value: unknown) {
        setFieldValue(name, value)
    }

    function reset(newValues?: Partial<T>) {
        if (newValues) {
            resetForm({ values: { ...(values as T), ...newValues } })
        } else {
            resetForm()
        }
    }

    return {
        values,
        errors: errors as Readonly<Ref<Record<string, string | undefined>>>,
        fieldList: fieldList as Readonly<Ref<AFormField[]>>,
        isSubmitting,
        isValid,
        meta,
        handleSubmit,
        setField,
        setValues: (next: Partial<T>) => setValues(next as T),
        reset,
        validate: async () => {
            await validate()
        },
    }
}

// Preset factories ----------------------------------------------------

/**
 * Login form schema (zod-validated, ready-to-use).
 */
export function createLoginSchema(): AFormSchema {
    return {
        fields: [
            {
                fieldName: 'username',
                label: '用户名',
                component: 'Input',
                componentProps: { placeholder: '请输入用户名', autocomplete: 'username' },
            },
            {
                fieldName: 'password',
                label: '密码',
                component: 'Password',
                componentProps: {
                    placeholder: '请输入密码',
                    autocomplete: 'current-password',
                },
            },
        ],
        validation: z.object({
            username: z.string().min(1, '请输入用户名'),
            password: z.string().min(1, '请输入密码'),
        }),
        initialValues: { username: '', password: '' },
    }
}

/**
 * Register form schema (with cross-field validation).
 */
export function createRegisterSchema(): AFormSchema {
    return {
        fields: [
            {
                fieldName: 'username',
                label: '用户名',
                componentProps: { placeholder: '请输入用户名', autocomplete: 'username' },
            },
            {
                fieldName: 'email',
                label: '邮箱',
                component: 'Email',
                componentProps: { placeholder: '请输入邮箱', autocomplete: 'email' },
            },
            {
                fieldName: 'password',
                label: '密码',
                component: 'Password',
                componentProps: {
                    placeholder: '请输入密码（至少 6 位）',
                    autocomplete: 'new-password',
                },
                description: '密码至少需要 6 位字符',
            },
            {
                fieldName: 'confirmPassword',
                label: '确认密码',
                component: 'Password',
                componentProps: {
                    placeholder: '请再次输入密码',
                    autocomplete: 'new-password',
                },
                description: '两次密码必须一致',
            },
        ],
        validation: z
            .object({
                username: z.string().min(1, '请输入用户名'),
                email: z.string().email('请输入正确的邮箱格式'),
                password: z.string().min(6, '密码至少 6 位'),
                confirmPassword: z.string().min(1, '请再次输入密码'),
            })
            .refine((data) => data.password === data.confirmPassword, {
                message: '两次密码输入不一致',
                path: ['confirmPassword'],
            }),
        initialValues: { username: '', email: '', password: '', confirmPassword: '' },
    }
}

/**
 * Change-password form schema.
 */
export function createChangePasswordSchema(): AFormSchema {
    return {
        fields: [
            {
                fieldName: 'currentPassword',
                label: '当前密码',
                component: 'Password',
                componentProps: { placeholder: '请输入当前密码', autocomplete: 'current-password' },
            },
            {
                fieldName: 'newPassword',
                label: '新密码',
                component: 'Password',
                componentProps: {
                    placeholder: '请输入新密码（至少 6 位）',
                    autocomplete: 'new-password',
                },
            },
            {
                fieldName: 'confirmPassword',
                label: '确认新密码',
                component: 'Password',
                componentProps: {
                    placeholder: '请再次输入新密码',
                    autocomplete: 'new-password',
                },
            },
        ],
        validation: z
            .object({
                currentPassword: z.string().min(1, '请输入当前密码'),
                newPassword: z.string().min(6, '新密码至少 6 位'),
                confirmPassword: z.string().min(1, '请再次输入新密码'),
            })
            .refine((data) => data.newPassword === data.confirmPassword, {
                message: '两次新密码输入不一致',
                path: ['confirmPassword'],
            }),
        initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    }
}

// AForm component (auto-renders fields from JSON schema)
export {
    default as AForm,
    type AFormField,
    type AFormSchema,
    type AFormFieldComponent,
} from './AForm.vue'

export { z }
