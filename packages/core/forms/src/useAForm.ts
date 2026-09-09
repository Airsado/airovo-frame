
import { Component, defineComponent, h, onUnmounted } from 'vue'
import { GenericObject, useForm } from 'vee-validate'
import { toTypedSchema } from "@vee-validate/zod"
import { FormApi } from './form-api'
import type { FormFieldSchema } from './types'
import { parseRules } from './rules'
import * as z from 'zod'
import { PartialDeep } from 'type-fest'
import AForm from './AForm.vue'

/**
 * useAForm传入的配置项类型
 */
export interface UseAFormOptions {
    // 表单的排列布局：label和表单的布局
    layout: "horizontal" | "vertical"
    // 一整个表单的外层class样式
    wrapperClass: unknown

    schema: FormFieldSchema[]
}

export interface UseAFormReturn {
    /** 表单的操作api */
    api: FormApi
    /** 依照配置创建的动态表单组件 */
    AForm: Component
}

/** 将Schema中的 fieldName:value 构造为useForm允许的格式 */
function computeInitialValues(schema: FormFieldSchema[]): PartialDeep<Record<string, unknown>, {
    recurseIntoArrays: false;
    allowUndefinedInNonTupleArrays: true;
}> {
    return schema.reduce((acc, item) => {
        const key = item.ArrayField ?? 'value'
        acc[item.fieldName] = [{ [key]: '' }]
        return acc
    }, {} as PartialDeep<Record<string, unknown>, {
        recurseIntoArrays: false;
        allowUndefinedInNonTupleArrays: true;
    }>)
}

/** 将Schema中的 fieldName:zod规则 构造为useForm允许的格式 */
function computedValidateFormSchema(schema: FormFieldSchema[]) {
    const validateRules = schema.reduce((acc, item) => {
        const zodRule = parseRules(item.rules)
        acc[item.fieldName] = zodRule
        return acc;
    }, {} as Record<string, z.ZodTypeAny>)

    return z.object(validateRules)
}

/**
 *
 * @param options form表单配置项
 * @returns 返回其组件、和操控api
 *
 * @example
 * const {api,AForm} = useAForm(options);
 * AForm作为组件使用,直接放到template即可
 * api 可以操控AForm的表单状态
 * useAForm内可以传递options,是对AForm的一些基础配置初始化,例如schema,布局等等
 */
export function useAForm<T extends GenericObject>(options: UseAFormOptions): UseAFormReturn {
    const { schema } = options
    const baseInitial = computeInitialValues(schema) as any
    const baseValidateValues = computedValidateFormSchema(schema)

    const form = useForm<T>({ initialValues: baseInitial, validationSchema: toTypedSchema(baseValidateValues) })
    const api = new FormApi(form)

    const AFormComponent = defineComponent(
        (props: Record<string, unknown>) => {
            return () => h(AForm, { ...props as any, api, schema }, {})
        },
        {
            props: {},
        }
    )

    // Tear down on unmount.
    onUnmounted(() => {
        api.unmount()
    })

    return {
        api,
        AForm: AFormComponent
    }
}
