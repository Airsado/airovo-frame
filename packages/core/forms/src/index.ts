import { computed, onMounted, onUnmounted } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import type { FormFieldSchema, FormProps } from './types'
import { FormApi } from './form-api'

// ── Re-exports ──

export { FormApi } from './form-api'
export { default as AForm } from './AForm.vue'
export { z }
export type {
    FormFieldSchema,
    FormProps,
    FormComponentMap,
    FormFieldDependencies,
    FormLayout,
    FormWrapperClass,
    FormApiLike,
    BuiltInFormComponent,
} from './types'

// ── useAForm ──

/**
 * Create a form instance backed by vee-validate + zod.
 *
 * @example
 * const { api, values, errors, handleSubmit } = useAForm({
 *   schema: [{ fieldName: 'username', label: '用户名', component: 'Input' }],
 *   validation: z.object({ username: z.string().min(1) }),
 * })
 *
 * // In template:
 * // <AForm :api="api" />
 */
export function useAForm(options: FormProps) {
    const api = new FormApi(options)

    const initialValues: Record<string, any> = {}
    for (const field of options.schema) {
        if (field.defaultValue !== undefined) {
            initialValues[field.fieldName] = field.defaultValue
        }
    }

    // Bridge vee-validate context into FormApi
    const formCtx = useForm({
        validationSchema: options.validation ? toTypedSchema(options.validation) : undefined,
        initialValues,
        validateOnBlur: true,
        validateOnChange: false,
    })

    onMounted(() => {
        api.mount(formCtx as any)
    })

    onUnmounted(() => {
        api.unmount()
    })

    return {
        api,
        values: formCtx.values,
        errors: formCtx.errors,
        handleSubmit: formCtx.handleSubmit,
        isSubmitting: formCtx.isSubmitting,
        isValid: formCtx.isValid,
    }
}

// ── Preset factories ──

export function createLoginSchema(): FormProps {
    return {
        schema: [
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
                componentProps: { placeholder: '请输入密码', autocomplete: 'current-password' },
            },
        ],
        validation: z.object({
            username: z.string().min(1, '请输入用户名'),
            password: z.string().min(1, '请输入密码'),
        }),
    }
}

export function createRegisterSchema(): FormProps {
    return {
        schema: [
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
                componentProps: { placeholder: '请输入密码（至少 6 位）', autocomplete: 'new-password' },
                description: '密码至少需要 6 位字符',
            },
            {
                fieldName: 'confirmPassword',
                label: '确认密码',
                component: 'Password',
                componentProps: { placeholder: '请再次输入密码', autocomplete: 'new-password' },
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
            .refine((d) => d.password === d.confirmPassword, {
                message: '两次密码输入不一致',
                path: ['confirmPassword'],
            }),
    }
}

export function createChangePasswordSchema(): FormProps {
    return {
        schema: [
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
                componentProps: { placeholder: '请输入新密码（至少 6 位）', autocomplete: 'new-password' },
            },
            {
                fieldName: 'confirmPassword',
                label: '确认新密码',
                component: 'Password',
                componentProps: { placeholder: '请再次输入新密码', autocomplete: 'new-password' },
            },
        ],
        validation: z
            .object({
                currentPassword: z.string().min(1, '请输入当前密码'),
                newPassword: z.string().min(6, '新密码至少 6 位'),
                confirmPassword: z.string().min(1, '请再次输入新密码'),
            })
            .refine((d) => d.newPassword === d.confirmPassword, {
                message: '两次新密码输入不一致',
                path: ['confirmPassword'],
            }),
    }
}
