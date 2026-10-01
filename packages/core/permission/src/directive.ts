/**
 * v-permission directive — hides an element if the current user
 * lacks the specified permission (or one of several). Usage:
 *
 *   <Button v-permission="'sys.user.delete'">删除</Button>
 *   <MenuItem v-permission="['sys.user.edit', 'sys.user.create']" />
 */
import { ref, watchEffect, type App, type Directive, type Ref } from 'vue'
import { usePermissionStore } from './store'

type PermBinding = string | string[]

interface PermissionBindingState {
    value: Ref<PermBinding>
    stop: () => void
    originalDisplay: string
}

const bindings = new WeakMap<HTMLElement, PermissionBindingState>()

export const permissionDirective: Directive<HTMLElement, PermBinding> = {
    mounted(el, binding) {
        const store = usePermissionStore()
        const value = ref(binding.value)
        const originalDisplay = el.style.display
        const stop = watchEffect(() => {
            const permissions = (Array.isArray(value.value) ? value.value : [value.value]).filter(Boolean)
            const allowed = permissions.length === 0 || permissions.some((permission) => store.hasPermission(permission))
            // Keep the node mounted so denied-to-allowed transitions retain its state.
            el.style.display = allowed ? originalDisplay : 'none'
        }, { flush: 'sync' })
        bindings.set(el, { value, stop, originalDisplay })
    },
    updated(el, binding) {
        const state = bindings.get(el)
        if (state) state.value.value = binding.value
    },
    unmounted(el) {
        const state = bindings.get(el)
        if (!state) return
        state.stop()
        el.style.display = state.originalDisplay
        bindings.delete(el)
    },
}

export function registerVPermission(app: App) {
    app.directive('permission', permissionDirective)
}
