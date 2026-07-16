import type { Component } from 'vue'
import type { ZodTypeAny } from 'zod'

/**
 * FormFieldSchema — v5-style unified schema.
 *
 * 每一个字段在内部都按数组渲染（VeeFieldArray），values 因此总是
 * 形如 `{ [fieldName]: [row1, row2, ...] }`。
 *
 * - `ArrayField` (默认 `'value'`): 数组行对象里取值的键
 * - `array: true`                  : 字段支持 push/remove 多行
 *
 * @example
 * ```ts
 * // 单值字段
 * { fieldName: 'username', label: '用户名', component: 'Input', array: false,
 *   rules: 'required' }
 *
 * // 数组字段
 * {
 *   type: 'array', // 兼容旧字段，可省略
 *   fieldName: 'emails', label: '邮箱列表',
 *   ArrayField: 'value', array: true,
 *   component: 'Input', componentProps: { type: 'email' },
 *   rules: 'required,email',
 *   maxItems: 5,
 *   addButtonText: '+ 添加邮箱',
 *   removeButtonText: '删除',
 * }
 * ```
 */
export interface FormFieldSchema {
    fieldName: string
    label: string
    component: Component | string
    componentProps?: Record<string, unknown>
    description?: string
    /**
     * 验证规则。两类：
     *   1. 直接传入 zod schema（复杂校验）
     *   2. 字符串 DSL（简单常用校验），支持的 token：
     *      - `required`     非空
     *      - `email`        邮箱
     *      - `phone`        中国大陆手机号（1[3-9]xxxxxxxxx）
     *      - `min:N`        至少 N 个字符
     *      - `max:N`        最多 N 个字符
     *      多个 token 用 `,` 分隔，按序叠加（链式）
     * @example 'required,email' / 'phone' / 'required,min:6,max:20'
     */
    rules?: ZodTypeAny | string
    /**
     * 数组行对象里取值的键。默认 'value'。
     * 例如 `ArrayField: 'phone'` 时，values.emails[0].phone。
     */
    ArrayField?: string
    /**
     * true = 数组字段，显示 push/remove 按钮，用户可增删行。
     * 缺省/false = 单值字段，固定 1 行，不显示增删 UI。
     */
    array?: boolean
    /** 数组字段行数上限（含已有行）。达到上限后 "+ 添加" 按钮禁用。 */
    maxItems?: number
    /** "+ 添加" 按钮文案。默认 "+ 添加"。 */
    addButtonText?: string
    /** "删除" 按钮文案。默认 "删除"。 */
    removeButtonText?: string
}
