import type { Component } from 'vue'

/**
 * FormFieldSchema — v5-style unified schema.
 *
 * 每一个字段在内部都按数组渲染（VeeFieldArray），values 因此总是
 * 形如 `{ [fieldName]: [row1, row2, ...] }`。
 *
 * - `ArrayField` (默认 `'value'`): 数组行对象里取值的键
 * - `array: true`                  : 字段支持 push/remove 多行
 * - `array: false` 或缺省         : 单值字段，固定 1 行（不显示增删 UI）
 *
 * @example
 * ```ts
 * // 单值字段
 * { fieldName: 'username', label: '用户名', component: 'Input', array: false }
 *
 * // 数组字段
 * {
 *   type: 'array', // 兼容旧字段，可省略
 *   fieldName: 'emails', label: '邮箱列表',
 *   ArrayField: 'value', array: true,
 *   component: 'Input', componentProps: { type: 'email' },
 * }
 * ```
 */
export interface FormFieldSchema {
    fieldName: string
    label: string
    component: Component | string
    componentProps?: Record<string, unknown>
    description?: string
    /** vee-validate 规则对象 / 字符串。 */
    rules?: Record<string, unknown> | string
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
}
