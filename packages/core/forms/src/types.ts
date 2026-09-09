import type { Component } from 'vue'
import type { ZodTypeAny } from 'zod'

/**
 * 存放框架现有的可用的组件映射，FormFiledSchema就可以自动推导出其props
 */
export interface ComponentPropsMap {
    'CustomInput': { placeholder?: string; maxlength?: number; size?: 'small' | 'large' },
    // 后续可扩展
}

export interface FormDependencies {
    // 触发字段。只有这些字段值变动时，联动才会触发
    triggerFields: string[]
    // 动态判断当前字段是否需要显示，不显示则直接销毁
    if?: boolean
    // 动态判断当前字段是否需要显示，不显示用css隐藏
    show?: boolean
    // 动态判断当前字段是否需要禁用
    disabled?: boolean
    // 字段变更时，都会触发该函数
    trigger?: void
    // 动态rules
    rules?: void
    // 动态必填
    required?: void
    // 动态组件参数
    componentProps?: void
}



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
export interface FormFieldSchema<T extends keyof ComponentPropsMap = keyof ComponentPropsMap> {
    fieldName: string
    label: string
    component: Component | T
    componentProps?: ComponentPropsMap[T]
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
     * 依赖其他一个或多个字段的控制当前字段的行为的字段（显隐、值变化等）
     */
    dependencies?: FormDependencies
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


// FormApiLike — 表单控制器接口
//
// FormApi 类（form-api.ts）实现这个接口，把 vee-validate 的 form context
// 包装成一个简洁的 CRUD + 验证 API，并镜像 errors 到响应式 Ref 供模板消费。
export interface FormApiLike {

    /**
     * 设置表单值
     * @param fields         要写入的值
     * @param filterFields   true（默认）= 只写入 schema 定义的字段
     * @param shouldValidate 写入后是否立即触发验证
     */
    setValues(
        fields: Record<string, unknown>,
        filterFields?: boolean,
        shouldValidate?: boolean,
    ): Promise<void>

    /**
     * 获取表单值
     * @param fields         可选，只返回指定字段；不传则返回所有
     * @param shouldValidate 获取前是否先触发验证
     */
    getValues(
        fields?: string[],
        shouldValidate?: boolean,
    ): Promise<Record<string, unknown>>

    /**
     * 检查某个字段是否已通过校验
     * @param fieldName 字段名称
     */
    isFieldValid(fieldName: string): boolean

    /**
     * 更新Schema列表
     * @param schema
     */
    updateSchema(schema: FormFieldSchema): void

    /**
     * 暂时没想好怎么去弄这个state
     */
    setState(): Promise<void>

    /**
     * 正常return的类型应该是对应表单的props的，而不是void，但是我还没去写对应的props的类型
     * 所以就先这样，毕竟还没想好怎么去设置其中的内容
     */
    getState(): Promise<void>

    /**
     * 获取当前已获得焦点的字段
     */
    getFocusedFiled(): string | undefined

    /**
     * 提交表单
     * @param payload 提交的表单值
     */
    submitForm(payload: any): Promise<Record<string, unknown>>

    /**
     * 验证并提交表单
     * @param e
     */
    ValidateAndSubmitForm(e: Event): Promise<Record<string, unknown> | boolean>

    /**
     * 校验指定字段
     * @param filedName 字段名称
     */
    validateFiled(filedName: string): Promise<unknown>

    /**
     * 重置其中表单校验
     */
    resetValidate(): Promise<void>

    /**
     * 设置指定字段的值。返回 true 表示成功。
     */
    setFieldValue(field: string, value: unknown): boolean

    /**
     * 重置表单内容到 initialValues。返回 true 表示成功。
     */
    resetForm(): boolean
}