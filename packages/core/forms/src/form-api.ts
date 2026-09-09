/**
 * FormApi — v5-aligned form controller.
 *
 * Wraps a vee-validate form context (provided by `mount()`) and
 * exposes a clean CRUD + validation API. The `errors` Ref mirrors
 * the raw vee-validate errors so templates can react to them without
 * writing a watch themselves.
 *
 * Lifecycle:
 *   1. `const api = new FormApi({ schema, validation, initialValues })`
 *   2. `api.mount(formContext)`   — connect to vee-validate's useForm return
 *   3. Use the API (setValues / getValues / setFieldValue / resetForm / validate)
 *   4. `api.unmount()`            — tear down the errors mirror watch
 */
import { ref, watch } from 'vue'
import type { ZodTypeAny } from 'zod'
import type { FormFieldSchema, FormApiLike } from './types'
import { FormContext } from 'vee-validate'

// 这里后续需要去修改掉，validation和initialValues都可以从schema中获取
export interface FormApiOptions {
    schema?: FormFieldSchema[]
    validation?: ZodTypeAny
    initialValues?: Record<string, unknown>
}

export class FormApi implements FormApiLike {


    /**
     * 用来记录错误
     */
    private errors = ref<unknown>();

    /**
     * form实例来自于 vee-validate库,可以访问到其中的所有方法和状态, FormApi是基于他的封装和扩展,更方便业务调用
     * 这里暴露出去方便特殊情况需要用到
     */
    public form: FormContext;
    private stopWatch: (() => void) | null = null

    constructor(form: FormContext) {
        this.form = form

        if (!form) {
            throw new Error("form 实例为空");
        }
        this.stopWatch?.()
        this.stopWatch = watch(
            () => {
                const errs = form?.errors
                if (!errs) return {}
                return ('value' in errs ? errs.value : errs) ?? {}
            },
            (v) => { this.errors.value = { ...(v ?? {}) } },
            { immediate: true, deep: true },
        )
    }

    /**
     * 该参数用于指示提交处理程序是否仍在运行。一旦处理完成或被拒绝，该参数会自动恢复为“false”。
     * @link https://vee-validate.logaretm.com/v4/api/use-form/#composable-api
     */
    get isSubmitting() {
        return this.form?.isSubmitting
    }

    unmount(): void {
        // this.form = null;
        this.stopWatch?.()
        this.stopWatch = null
    }

    isFieldValid(fieldName: string): boolean {
        return this.form.isFieldValid(fieldName);
    }

    updateSchema(schema: FormFieldSchema): void {
        console.log(schema)
        throw new Error('Method not implemented.')
    }

    setState(): Promise<void> {
        console.log("还没想好怎么处理")
        throw new Error('Method not implemented.')
    }

    async getState(): Promise<void> {
        // 不知道怎么获取其state，目前一个小想法是定义一个state状态，根据表单的情况去动态变化状态，然后这里再get获取暴露出去
    }

    getFocusedFiled(): string | undefined {
        throw new Error('Method not implemented.')
    }

    async submitForm(payload: any): Promise<Record<string, unknown>> {
        // 依旧没想好怎么写，先这样吧
        const cb = this.form?.handleSubmit(payload)

        return cb as any
    }

    // 重置其验证
    resetValidate(): Promise<void> {
        throw new Error('Method not implemented.')
    }

    async ValidateAndSubmitForm(e: Event): Promise<Record<string, unknown> | boolean> {
        const { valid } = await this.validate()

        if (!valid) {
            return Promise.resolve(false);
        }

        return e as any
    }

    // 这里需要对所有内容进行验证
    async validateFiled(filedName: string): Promise<unknown> {
        return await this.form?.validateField(filedName)
    }


    async setValues(
        fields: Record<string, unknown>,
        shouldValidate: boolean = false,
    ): Promise<void> {
        if (!this.form) return
        const payload = { ...fields }
        this.form.setValues(payload)
        if (shouldValidate) await this.validate()
    }

    async getValues(
        fields?: string[],
        shouldValidate: boolean = false,
    ): Promise<Record<string, unknown>> {
        if (!this.form) return {}
        if (shouldValidate) await this.validate()
        const raw = this.form.values
        const value = raw && typeof raw === 'object' && 'value' in raw ? raw.value : raw
        if (fields?.length) {
            const out: Record<string, unknown> = {}
            for (const f of fields) out[f] = value?.[f]
            return out
        }
        return { ...(value ?? {}) }
    }

    setFieldValue(field: string, value: unknown): boolean {
        if (!this.form) return false
        this.form.setFieldValue(field, value)
        return true
    }

    resetForm(): boolean {
        if (!this.form) return false
        this.form.resetForm()
        return true
    }

    async validate(): Promise<{ valid: boolean; errors: Record<string, unknown> }> {
        if (!this.form) return { valid: true, errors: {} }
        const result = await this.form.validate()
        return { valid: result.valid, errors: (result as any).errors ?? {} }
    }

    async validateField(name: string): Promise<{ valid: boolean }> {
        if (!this.form) return { valid: true }
        return await this.form.validateField(name)
    }

    clearValid(): void {
        this.form?.resetForm?.()
    }

}

export type { FormApiLike } from './types'
