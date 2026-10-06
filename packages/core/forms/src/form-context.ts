import type { FormContext, PrivateFormContext } from 'vee-validate'
import { FormContextKey, PublicFormContextKey } from 'vee-validate'
import { getCurrentInstance, type ComponentInternalInstance } from 'vue'
import type { FormApi } from './form-api'

/**
 * vee-validate installs its provider on the component that calls useForm.
 * Multiple framework forms can be created from one setup function, so each
 * controller needs to carry the two contexts captured immediately after its
 * own useForm call. The public context is intentionally kept separate from
 * the private context: FieldArray mutates the latter's values and internals.
 */
export interface FormContexts {
    private: PrivateFormContext
    public: FormContext
}

const contexts = new WeakMap<FormApi, FormContexts>()

export function registerFormContexts(api: FormApi, publicContext: FormContext): void {
    // inject() searches ancestors rather than the current instance. Read the
    // provider installed by this exact useForm call before another call can
    // replace it; keep this Vue implementation detail inside this adapter.
    const owner = getCurrentInstance() as (ComponentInternalInstance & {
        provides: Record<symbol, unknown>
    }) | null
    const privateContext = owner?.provides[FormContextKey as symbol] as PrivateFormContext | undefined
    if (!privateContext || privateContext.setValues !== publicContext.setValues) {
        throw new Error('useForm could not capture its vee-validate context')
    }
    contexts.set(api, { private: privateContext, public: publicContext })
}

export function getFormContexts(api: FormApi): FormContexts | undefined {
    return contexts.get(api)
}

export function unregisterFormContexts(api: FormApi): void {
    contexts.delete(api)
}

export { FormContextKey, PublicFormContextKey }
