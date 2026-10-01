import type { Component } from 'vue'
import { useAForm, type UseFormOptions } from './useAForm'
import type { FormApi } from './form-api'

/**
 * Tuple-style form composable for framework forms.
 * The existing useAForm object API remains supported; this is the ergonomic
 * `[Form, formApi]` entry point for pages that prefer a controller pattern.
 */
export function useForm(options: UseFormOptions = {}): readonly [Component, FormApi] {
    const result = useAForm(options)
    return [result.AForm, result.api] as const
}
