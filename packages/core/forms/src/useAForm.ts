/**
 * useAForm — 顶层 composable，把 vee-validate 的 useForm + FormApi
 * 包成一个统一的入口。返回 FormApi（CRUD + 验证）以及响应式的
 * values / errors refs 供模板直接消费。
 *
 * 用法：
 * ```ts
 * const { api, values, errors, submitForm } = useAForm({
 *     schema: formSchema,
 *     initialValues: { ... },
 *     validation: z.object({ ... }),
 * })
 *
 * async function onSubmit() {
 *     const result = await submitForm(async (vals) => {
 *         await api.login(vals.username[0].value)
 *     })
 *     if (!result) return // validation failed, errors.value populated
 * }
 * ```
 *
 * useAForm 会通过 provide 把 form context 暴露给子组件
 * （FormFieldRender 用 inject 拿到），避免每个字段组件自己创建
 * useForm() 产生多个独立 form context。
 */
import { onUnmounted, provide, ref, watch, type InjectionKey, type Ref } from 'vue'
import { useForm, type FormContext } from 'vee-validate'
import type { ZodTypeAny } from 'zod'
import { FormApi } from './form-api'
import type { FormFieldSchema, FormApiLike } from './types'
import { parseRules } from './rules'

/** inject key — FormFieldRender 用这个 key 拿到 useAForm 创建的 form */
export const FORM_CONTEXT_KEY: InjectionKey<FormContext> = Symbol('formContext')

export interface UseAFormOptions {
    schema: FormFieldSchema[]
    initialValues?: Record<string, any>
    validation?: ZodTypeAny
}

export interface UseAFormReturn {
    /** The form controller. */
    api: FormApi
    /** Reactive current values. */
    values: Ref<Record<string, any>>
    /** Reactive error map (mirrors api.errors). */
    errors: Ref<Record<string, string>>
    /** Build initial values for a single field given the schema. */
    buildFieldInitialValue(item: FormFieldSchema): unknown
    /**
     * Validate then call onSubmit. Returns the values on success, or
     * null on validation failure (errors.value is populated).
     */
    submitForm: FormApiLike['submitForm']
}

/** Compute initial values from the schema (single fields get 1 row, arrays start empty). */
function computeInitialValues(schema: FormFieldSchema[]): Record<string, any> {
    return schema.reduce((acc, item) => {
        const key = item.ArrayField ?? 'value'
        acc[item.fieldName] = item.array ? [] : [{ [key]: '' }]
        return acc
    }, {} as Record<string, any>)
}

export function useAForm(options: UseAFormOptions): UseAFormReturn {
    const { schema, initialValues: userInit } = options
    const baseInitial = computeInitialValues(schema)
    const initialValues = userInit
        ? { ...baseInitial, ...userInit }
        : baseInitial

    // vee-validate 的 useForm（绑定到 schema 的每个字段的 rules）。
    // 这个调用也会在组件树里 provide form context。
    const form = useForm({ initialValues })

    // Build the FormApi and mount the form context to it.
    const api = new FormApi({ schema, initialValues })
    api.mount(form as any)

    // Explicit provide（vee-validate 自己也会 provide，但这里显式再 provide
    // 一次方便 FormFieldRender 用 FORM_CONTEXT_KEY 拿到）。
    provide(FORM_CONTEXT_KEY, form)

    // Reactive values mirror.
    const values = ref<Record<string, any>>(initialValues)
    watch(
        () => (form as any).values,
        (v) => { values.value = (v && typeof v === 'object' && 'value' in v) ? v.value : (v ?? {}) },
        { immediate: true, deep: true },
    )

    // Tear down on unmount.
    onUnmounted(() => {
        api.unmount()
    })

    return {
        api,
        values,
        errors: api.errors,
        buildFieldInitialValue: (item) => {
            const key = item.ArrayField ?? 'value'
            return item.array ? [] : [{ [key]: '' }]
        },
        submitForm: async (onSubmit) => {
            const result = await api.validate()
            if (!result.valid) return null
            const vals = await api.getValues()
            if (onSubmit) await onSubmit(vals)
            return vals
        },
    } as UseAFormReturn
}
