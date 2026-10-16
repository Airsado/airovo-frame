import { computed, defineComponent, h, onUnmounted, type Component, type ComputedRef } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm as useVeeForm } from 'vee-validate'
import { z } from 'zod'
import { FormApi } from './form-api'
import type { FormFieldSchema, FormRuntimeProps } from './types'
import { parseRules } from './rules'
import AForm from './AForm.vue'
import { registerFormContexts, unregisterFormContexts } from './form-context'
import { resolveFieldDefault } from './form-defaults'

export interface UseFormOptions extends FormRuntimeProps {
    schema?: FormFieldSchema[]
    validation?: z.ZodTypeAny
    initialValues?: Record<string, unknown>
}

export interface UseFormReturn {
    api: FormApi
    AForm: Component
    values: ComputedRef<Record<string, unknown>>
    errors: FormApi['errors']
    isSubmitting: ComputedRef<boolean>
    submitForm: FormApi['submitForm']
}

/** @deprecated Prefer `UseFormOptions`. Kept for migration compatibility. */
export type UseAFormOptions = UseFormOptions

/** @deprecated Prefer `UseFormReturn`. Kept for migration compatibility. */
export type UseAFormReturn = UseFormReturn

function pathSegments(path: string): string[] {
    return path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
}

function setAtPath(target: Record<string, unknown>, path: string, value: unknown): void {
    const segments = pathSegments(path)
    if (!segments.length) return
    let current: unknown = target
    segments.forEach((segment, index) => {
        const isLast = index === segments.length - 1
        if (isLast) {
            ;(current as Record<string, unknown>)[segment] = value
            return
        }
        const nextSegment = segments[index + 1]
        const record = current as Record<string, unknown>
        if (!record[segment] || typeof record[segment] !== 'object') {
            record[segment] = /^\d+$/.test(nextSegment) ? [] : {}
        }
        current = record[segment]
    })
}

function mergeValues(target: Record<string, unknown>, source: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(source)) {
        if (key.includes('.') || key.includes('[')) {
            setAtPath(target, key, value)
            continue
        }
        if (value && typeof value === 'object' && !Array.isArray(value)
            && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
            mergeValues(target[key] as Record<string, unknown>, value as Record<string, unknown>)
        } else {
            target[key] = value
        }
    }
}

interface SchemaTree {
    value?: z.ZodTypeAny
    children: Record<string, SchemaTree>
}

type DependencyContext = { values: Record<string, unknown>; api: FormApi; fieldName?: string; value?: unknown }

function resolveDependency<T>(
    value: T | ((context: DependencyContext) => T) | undefined,
    fallback: T,
    context: DependencyContext,
): T {
    return typeof value === 'function'
        ? (value as (context: DependencyContext) => T)(context)
        : value ?? fallback
}

function fieldRules(item: FormFieldSchema, values: Record<string, unknown>, api: FormApi): FormFieldSchema['rules'] {
    const context = { values, api, fieldName: item.fieldName }
    const rules = resolveDependency(item.dependencies?.rules, item.rules, context)
    const required = resolveDependency(item.dependencies?.required, false, context)
    if (!required) return rules
    if (typeof rules === 'string') {
        return rules.split(',').some((token) => token.trim() === 'required')
            ? rules
            : rules ? `${rules},required` : 'required'
    }
    return rules ?? 'required'
}

function treeSchema(tree: SchemaTree): z.ZodTypeAny {
    if (tree.value && !Object.keys(tree.children).length) return tree.value
    return z.object(Object.fromEntries(Object.entries(tree.children).map(([key, child]) => [key, treeSchema(child)])))
}

function isSchemaFieldActive(
    item: FormFieldSchema,
    values: Record<string, unknown>,
    api: FormApi,
): boolean {
    const context = { values, api, fieldName: item.fieldName }
    const show = resolveDependency(item.show, true, context)
    const ifVisible = resolveDependency(item.dependencies?.if, true, context)
    const dependencyVisible = resolveDependency(item.dependencies?.show, true, context)
    return show && ifVisible && dependencyVisible
}

function nestedValueSchema(
    item: FormFieldSchema,
    values: Record<string, unknown>,
    api: FormApi,
): z.ZodTypeAny {
    if (item.children?.length) {
        const objectSchema = z.object(Object.fromEntries(item.children
            .filter((child) => isSchemaFieldActive(child, values, api))
            .map((child) => [child.fieldName, nestedValueSchema(child, values, api)])))
        return item.array ? z.array(objectSchema) : objectSchema
    }
    const rules = fieldRules(item, values, api)
    const leaf = z.object({ [item.ArrayField ?? 'value']: parseRules(rules) })
    return item.array ? z.array(leaf) : parseRules(rules)
}

function fieldRowSchema(
    item: FormFieldSchema,
    values: Record<string, unknown>,
    api: FormApi,
): z.ZodTypeAny {
    if (item.children?.length) {
        return z.object(Object.fromEntries(item.children
            .filter((child) => isSchemaFieldActive(child, values, api))
            .map((child) => [child.fieldName, nestedValueSchema(child, values, api)])))
    }
    const key = item.ArrayField ?? 'value'
    return z.object({ [key]: parseRules(fieldRules(item, values, api)) })
}

function fieldSchema(item: FormFieldSchema, values: Record<string, unknown>, api: FormApi): z.ZodTypeAny {
    const row = fieldRowSchema(item, values, api)
    return item.array ? z.array(row) : z.array(row).length(1)
}

function fieldRowInitialValue(
    item: FormFieldSchema,
    api: FormApi,
    values: Record<string, unknown>,
): Record<string, unknown> {
    if (item.children?.length) {
        return Object.fromEntries(item.children.map((child) => [
            child.fieldName,
            child.array
                ? [fieldRowInitialValue(child, api, values)]
                : child.children?.length
                    ? fieldRowInitialValue(child, api, values)
                    : resolveFieldDefault(child, { values, api }),
        ]))
    }
    return { [item.ArrayField ?? 'value']: resolveFieldDefault(item, { values, api }) }
}

function schemaValidation(
    schema: FormFieldSchema[],
    values: Record<string, unknown>,
    api: FormApi,
): z.ZodTypeAny {
    const root: SchemaTree = { children: {} }
    schema
        .filter((item) => isSchemaFieldActive(item, values, api))
        .forEach((item) => {
            const segments = pathSegments(item.fieldName)
            let cursor = root
            segments.forEach((segment) => {
                cursor.children[segment] ??= { children: {} }
                cursor = cursor.children[segment]
            })
            cursor.value = fieldSchema(item, values, api)
        })
    return treeSchema(root)
}

function schemaInitialValues(
    schema: FormFieldSchema[],
    api: FormApi,
    overrides: Record<string, unknown>,
): Record<string, unknown> {
    const values: Record<string, unknown> = {}
    for (const item of schema) {
        setAtPath(values, item.fieldName, [fieldRowInitialValue(item, api, values)])
    }
    mergeValues(values, overrides)
    return values
}

/** @deprecated Prefer the tuple controller API returned by `useForm`. */
export function useAForm(
    options: UseFormOptions = {},
): UseFormReturn {
    const api = new FormApi(options)
    const initialValues = schemaInitialValues(api.schema, api, options.initialValues ?? {})
    Object.assign(api.initialValues, initialValues)
    const validationSchema = computed(() => toTypedSchema(
        options.validation ?? schemaValidation(
            api.schema,
            api.values.value,
            api,
        ),
    ))
    const form = useVeeForm({
        initialValues,
        validationSchema,
        keepValuesOnUnmount: true,
    })
    registerFormContexts(api, form)
    api.mount(form)

    const isSubmitting = computed(() => api.isSubmitting)

    const AFormComponent = defineComponent({
        name: 'AFormInstance',
        inheritAttrs: false,
        setup(_, { attrs, slots }) {
            return () => h(
                AForm,
                { ...attrs, api },
                slots,
            )
        },
    })

    onUnmounted(() => {
        unregisterFormContexts(api)
        api.unmount()
    })

    return {
        api,
        AForm: AFormComponent,
        values: api.values,
        errors: api.errors,
        isSubmitting,
        submitForm: api.submitForm.bind(api),
    }
}
