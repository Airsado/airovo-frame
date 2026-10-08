import { inject, type InjectionKey, type Ref } from 'vue'
import type { FormApi } from './form-api'

interface FormDom {
    id: string
    element: Ref<HTMLFormElement | null>
}

export const FormDomKey: InjectionKey<FormDom> = Symbol('form-dom')
const renderers = new WeakMap<FormApi, Set<FormDom>>()

// DOM ownership follows the renderer, while values/context follow the controller.
// Closing an overlay must remove its old DOM without discarding the form session.
export function registerFormDom(api: FormApi, dom: FormDom): () => void {
    const roots = renderers.get(api) ?? new Set<FormDom>()
    roots.add(dom)
    renderers.set(api, roots)
    return () => {
        roots.delete(dom)
        if (!roots.size) renderers.delete(api)
    }
}

export function useFieldId(): (path: string) => string {
    const dom = inject(FormDomKey)
    if (!dom) throw new Error('Form fields must be rendered inside AForm')
    return (path) => `form-${dom.id}-${encodeURIComponent(path)}`
}

export function findFormField(api: FormApi, name: string): HTMLElement | undefined {
    for (const dom of renderers.get(api) ?? []) {
        const root = dom.element.value
        if (!root?.isConnected) continue
        // Comparing attribute values avoids selector escaping and never crosses
        // another form root, including nested custom renderers.
        const field = Array.from(root.querySelectorAll<HTMLElement>('[name]'))
            .find((element) => element.getAttribute('name') === name
                && element.closest('form') === root
                && !(element instanceof HTMLInputElement && element.type === 'hidden'))
        if (field) return field
    }
}
